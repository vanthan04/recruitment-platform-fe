import { createRoomSocket } from "@/lib/realtime/room-socket";
import type { IceServer, InterviewViewerRole } from "@/lib/types/interview";
import type { RoomClient, RoomClientEvents } from "./room-client";

/** The slice of a socket.io client this class needs — lets tests pass a fake. */
export interface SignalingSocket {
  on(event: string, handler: (...args: never[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
  connect(): unknown;
  disconnect(): unknown;
}

export interface P2pRoomClientDeps {
  createPeerConnection(config: RTCConfiguration): RTCPeerConnection;
  createSocket(): SignalingSocket;
}

export interface P2pRoomClientOptions {
  interviewId: string;
  role: InterviewViewerRole;
  iceServers: IceServer[];
  events: RoomClientEvents;
  deps?: P2pRoomClientDeps;
}

interface IncomingSignal {
  from: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const defaultDeps: P2pRoomClientDeps = {
  createPeerConnection: (config) => new RTCPeerConnection(config),
  createSocket: () => createRoomSocket(),
};

/**
 * Self-hosted WebRTC for a 1:1 room. Signaling (SDP/ICE) is relayed by the
 * backend's `/rtc` socket namespace; media flows browser-to-browser.
 *
 * Negotiation follows the "perfect negotiation" pattern so both sides can
 * start an offer at the same moment without deadlocking: when offers collide,
 * the *polite* peer (the candidate) rolls back and accepts the other's offer,
 * the *impolite* one (the recruiter) ignores the incoming offer.
 */
export class P2pRoomClient implements RoomClient {
  private readonly deps: P2pRoomClientDeps;
  private readonly polite: boolean;
  private socket: SignalingSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private makingOffer = false;
  private ignoreOffer = false;
  private joined = false;
  private left = false;

  constructor(private readonly options: P2pRoomClientOptions) {
    this.deps = options.deps ?? defaultDeps;
    this.polite = options.role === "CANDIDATE";
  }

  join(localStream: MediaStream): Promise<void> {
    this.localStream = localStream;
    const socket = this.deps.createSocket();
    this.socket = socket;
    const { events, interviewId } = this.options;

    events.onStatus("connecting");

    socket.on("connect", () => {
      // First connect and every automatic reconnect: the server forgot us, so re-enter.
      socket.emit("room:join", { interviewId });
    });
    socket.on("disconnect", () => {
      if (!this.left) events.onStatus("reconnecting");
    });
    socket.on("connect_error", (error: Error) => {
      if (!this.joined) events.onStatus("failed", error.message);
    });

    socket.on("room:joined", (payload: { peers: unknown[] }) => {
      this.joined = true;
      if (payload.peers.length > 0) {
        const pc = this.ensurePeerConnection();
        // After a signaling reconnect the media path may well have survived.
        const mediaUp = pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed";
        events.onStatus(mediaUp ? "connected" : "connecting");
      } else {
        // Alone — if the peer left while we were disconnected, drop their stale connection.
        this.closePeerConnection();
        events.onStatus("waiting");
      }
    });
    socket.on("room:peer-joined", () => {
      events.onStatus("connecting");
      this.ensurePeerConnection();
    });
    socket.on("room:peer-left", () => {
      this.closePeerConnection();
      events.onStatus("waiting");
    });
    socket.on("rtc:signal", (signal: IncomingSignal) => {
      void this.handleSignal(signal);
    });
    socket.on("room:replaced", () => {
      this.teardown();
      events.onStatus("replaced");
    });
    socket.on("room:closed", () => {
      this.teardown();
      events.onStatus("closed");
    });
    socket.on("room:error", (payload: { message?: string }) => {
      // Before the join succeeded this is fatal (not a participant, no open
      // session, ...); afterwards it is a refused signal (rate limit) — keep going.
      if (!this.joined) {
        this.teardown();
        events.onStatus("failed", payload?.message);
      }
    });

    socket.connect();
    return Promise.resolve();
  }

  leave(): void {
    if (this.left) return;
    this.socket?.emit("room:leave");
    this.teardown();
  }

  private teardown(): void {
    this.left = true;
    this.closePeerConnection();
    this.socket?.disconnect();
    this.socket = null;
  }

  private closePeerConnection(): void {
    if (!this.pc) return;
    const pc = this.pc;
    this.pc = null;
    this.makingOffer = false;
    this.ignoreOffer = false;
    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onnegotiationneeded = null;
    pc.oniceconnectionstatechange = null;
    pc.close();
    this.options.events.onRemoteStream(null);
  }

  private ensurePeerConnection(): RTCPeerConnection {
    if (this.pc) return this.pc;

    const { events, iceServers } = this.options;
    const pc = this.deps.createPeerConnection({ iceServers });
    this.pc = pc;

    // Tracks go in before any offer is made, so the very first negotiation
    // already carries our audio and video.
    for (const track of this.localStream?.getTracks() ?? []) {
      pc.addTrack(track, this.localStream!);
    }

    pc.ontrack = ({ streams }) => {
      events.onRemoteStream(streams[0] ?? null);
    };

    pc.onicecandidate = ({ candidate }) => {
      // `null` is the end-of-candidates marker; nothing to relay.
      if (candidate) this.socket?.emit("rtc:signal", { candidate: candidate.toJSON() });
    };

    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await pc.setLocalDescription();
        if (pc.localDescription) {
          this.socket?.emit("rtc:signal", { description: pc.localDescription.toJSON() });
        }
      } catch (error) {
        console.error("Room negotiation failed", error);
      } finally {
        this.makingOffer = false;
      }
    };

    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          events.onStatus("connected");
          break;
        case "disconnected":
          events.onStatus("reconnecting");
          break;
        case "failed":
          // Try a fresh set of candidate pairs before giving up on the call.
          events.onStatus("reconnecting");
          pc.restartIce();
          break;
        default:
          break;
      }
    };

    return pc;
  }

  private async handleSignal({ description, candidate }: IncomingSignal): Promise<void> {
    const pc = this.ensurePeerConnection();
    try {
      if (description) {
        const offerCollision =
          description.type === "offer" && (this.makingOffer || pc.signalingState !== "stable");
        this.ignoreOffer = !this.polite && offerCollision;
        if (this.ignoreOffer) return;

        await pc.setRemoteDescription(description);
        if (description.type === "offer") {
          await pc.setLocalDescription();
          if (pc.localDescription) {
            this.socket?.emit("rtc:signal", { description: pc.localDescription.toJSON() });
          }
        }
      } else if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          // Candidates that belong to an offer we deliberately ignored are expected to fail.
          if (!this.ignoreOffer) throw error;
        }
      }
    } catch (error) {
      console.error("Room signal handling failed", error);
    }
  }
}
