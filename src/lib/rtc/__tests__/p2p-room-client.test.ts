import { P2pRoomClient, type SignalingSocket } from "../p2p-room-client";
import { createRoomClient } from "../room-client";
import type { InterviewViewerRole } from "@/lib/types/interview";

class FakeSocket implements SignalingSocket {
  handlers = new Map<string, (...args: never[]) => void>();
  emit = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
  on(event: string, handler: (...args: never[]) => void) {
    this.handlers.set(event, handler);
  }
  fire(event: string, ...args: unknown[]) {
    (this.handlers.get(event) as ((...a: unknown[]) => void) | undefined)?.(...args);
  }
}

class FakePeerConnection {
  signalingState = "stable";
  iceConnectionState = "new";
  localDescription: { toJSON(): unknown } | null = null;
  addTrack = jest.fn();
  close = jest.fn();
  restartIce = jest.fn();
  addIceCandidate = jest.fn(() => Promise.resolve());
  setRemoteDescription = jest.fn((description: { type: string }) => {
    this.signalingState = description.type === "offer" ? "have-remote-offer" : "stable";
    return Promise.resolve();
  });
  setLocalDescription = jest.fn(() => {
    const type = this.signalingState === "have-remote-offer" ? "answer" : "offer";
    this.localDescription = { toJSON: () => ({ type, sdp: "local-sdp" }) };
    return Promise.resolve();
  });
  onicecandidate: ((e: unknown) => void) | null = null;
  ontrack: ((e: unknown) => void) | null = null;
  onnegotiationneeded: (() => Promise<void>) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  constructor(public config: unknown) {}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(role: InterviewViewerRole = "CANDIDATE") {
  const socket = new FakeSocket();
  const pcs: FakePeerConnection[] = [];
  const events = { onStatus: jest.fn(), onRemoteStream: jest.fn() };
  const tracks = [{ kind: "audio" }, { kind: "video" }];
  const localStream = { getTracks: () => tracks } as unknown as MediaStream;
  const iceServers = [{ urls: ["stun:stun.example.com"] }];

  const client = new P2pRoomClient({
    interviewId: "interview-1",
    role,
    iceServers,
    events,
    deps: {
      createSocket: () => socket,
      createPeerConnection: (config) => {
        const pc = new FakePeerConnection(config);
        pcs.push(pc);
        return pc as unknown as RTCPeerConnection;
      },
    },
  });
  return { client, socket, pcs, events, localStream, tracks, iceServers };
}

const peer = { userId: "other", role: "RECRUITER" };

describe("P2pRoomClient", () => {
  describe("joining", () => {
    it("joins the room on connect and reports waiting when alone", async () => {
      const { client, socket, pcs, events, localStream } = setup();

      await client.join(localStream);
      expect(events.onStatus).toHaveBeenLastCalledWith("connecting");
      expect(socket.connect).toHaveBeenCalled();

      socket.fire("connect");
      expect(socket.emit).toHaveBeenCalledWith("room:join", { interviewId: "interview-1" });

      socket.fire("room:joined", { peers: [] });
      expect(events.onStatus).toHaveBeenLastCalledWith("waiting");
      expect(pcs).toHaveLength(0);
    });

    it("re-joins after a socket reconnect", async () => {
      const { client, socket, localStream, events } = setup();
      await client.join(localStream);
      socket.fire("connect");
      socket.fire("room:joined", { peers: [] });

      socket.fire("disconnect");
      expect(events.onStatus).toHaveBeenLastCalledWith("reconnecting");
      socket.fire("connect");

      expect(socket.emit.mock.calls.filter(([e]) => e === "room:join")).toHaveLength(2);
    });

    it("fails when the server refuses the join, and tears down", async () => {
      const { client, socket, events, localStream } = setup();
      await client.join(localStream);

      socket.fire("room:error", { message: "Start the interview session before joining the room" });

      expect(events.onStatus).toHaveBeenLastCalledWith(
        "failed",
        "Start the interview session before joining the room",
      );
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it("keeps going when a later signal is refused (e.g. rate limit)", async () => {
      const { client, socket, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [] });

      socket.fire("room:error", { message: "Too many signals — slow down" });

      expect(events.onStatus).not.toHaveBeenCalledWith("failed", expect.anything());
      expect(socket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("peer connection", () => {
    it("publishes local tracks and offers when a peer is already in the room", async () => {
      const { client, socket, pcs, localStream, tracks, iceServers } = setup();
      await client.join(localStream);

      socket.fire("room:joined", { peers: [peer] });

      expect(pcs).toHaveLength(1);
      expect(pcs[0].config).toEqual({ iceServers });
      expect(pcs[0].addTrack).toHaveBeenCalledTimes(tracks.length);

      await pcs[0].onnegotiationneeded!();
      expect(socket.emit).toHaveBeenCalledWith("rtc:signal", {
        description: { type: "offer", sdp: "local-sdp" },
      });
    });

    it("creates the connection when a peer joins later", async () => {
      const { client, socket, pcs, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [] });

      socket.fire("room:peer-joined", peer);

      expect(pcs).toHaveLength(1);
    });

    it("forwards ICE candidates but not the end-of-candidates marker", async () => {
      const { client, socket, pcs, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      socket.emit.mockClear();

      pcs[0].onicecandidate!({ candidate: { toJSON: () => ({ candidate: "candidate:1" }) } });
      pcs[0].onicecandidate!({ candidate: null });

      expect(socket.emit).toHaveBeenCalledTimes(1);
      expect(socket.emit).toHaveBeenCalledWith("rtc:signal", { candidate: { candidate: "candidate:1" } });
    });

    it("hands the remote stream to the UI", async () => {
      const { client, socket, pcs, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      const remote = {} as MediaStream;

      pcs[0].ontrack!({ streams: [remote] });

      expect(events.onRemoteStream).toHaveBeenCalledWith(remote);
    });

    it("answers a remote offer", async () => {
      const { client, socket, pcs, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      socket.emit.mockClear();

      socket.fire("rtc:signal", { from: "other", description: { type: "offer", sdp: "remote-sdp" } });
      await flush();

      expect(pcs[0].setRemoteDescription).toHaveBeenCalledWith({ type: "offer", sdp: "remote-sdp" });
      expect(socket.emit).toHaveBeenCalledWith("rtc:signal", {
        description: { type: "answer", sdp: "local-sdp" },
      });
    });

    it("applies a remote answer and ICE candidates", async () => {
      const { client, socket, pcs, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });

      socket.fire("rtc:signal", { from: "other", description: { type: "answer", sdp: "a" } });
      socket.fire("rtc:signal", { from: "other", candidate: { candidate: "candidate:2" } });
      await flush();

      expect(pcs[0].setRemoteDescription).toHaveBeenCalledWith({ type: "answer", sdp: "a" });
      expect(pcs[0].addIceCandidate).toHaveBeenCalledWith({ candidate: "candidate:2" });
    });
  });

  describe("offer collisions (perfect negotiation)", () => {
    it("polite peer (candidate) accepts an offer that collides with its own", async () => {
      const { client, socket, pcs, localStream } = setup("CANDIDATE");
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      pcs[0].signalingState = "have-local-offer";

      socket.fire("rtc:signal", { from: "other", description: { type: "offer", sdp: "theirs" } });
      await flush();

      expect(pcs[0].setRemoteDescription).toHaveBeenCalledWith({ type: "offer", sdp: "theirs" });
    });

    it("impolite peer (recruiter) ignores a colliding offer and the candidates that follow it", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { client, socket, pcs, localStream } = setup("RECRUITER");
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      pcs[0].signalingState = "have-local-offer";
      pcs[0].addIceCandidate.mockRejectedValue(new Error("no remote description"));

      socket.fire("rtc:signal", { from: "other", description: { type: "offer", sdp: "theirs" } });
      socket.fire("rtc:signal", { from: "other", candidate: { candidate: "candidate:9" } });
      await flush();

      expect(pcs[0].setRemoteDescription).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("impolite peer still accepts an offer when nothing collides", async () => {
      const { client, socket, pcs, localStream } = setup("RECRUITER");
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });

      socket.fire("rtc:signal", { from: "other", description: { type: "offer", sdp: "theirs" } });
      await flush();

      expect(pcs[0].setRemoteDescription).toHaveBeenCalled();
    });
  });

  describe("connection state", () => {
    it("reports connected, reconnecting and restarts ICE on failure", async () => {
      const { client, socket, pcs, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      const pc = pcs[0];

      pc.iceConnectionState = "connected";
      pc.oniceconnectionstatechange!();
      expect(events.onStatus).toHaveBeenLastCalledWith("connected");

      pc.iceConnectionState = "disconnected";
      pc.oniceconnectionstatechange!();
      expect(events.onStatus).toHaveBeenLastCalledWith("reconnecting");

      pc.iceConnectionState = "failed";
      pc.oniceconnectionstatechange!();
      expect(pc.restartIce).toHaveBeenCalled();
    });

    it("reports connected straight away after a signaling reconnect if media survived", async () => {
      const { client, socket, pcs, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });
      pcs[0].iceConnectionState = "connected";

      socket.fire("room:joined", { peers: [peer] });

      expect(pcs).toHaveLength(1);
      expect(events.onStatus).toHaveBeenLastCalledWith("connected");
    });

    it("drops the connection and waits again when the peer leaves", async () => {
      const { client, socket, pcs, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });

      socket.fire("room:peer-left", { userId: "other" });

      expect(pcs[0].close).toHaveBeenCalled();
      expect(events.onRemoteStream).toHaveBeenLastCalledWith(null);
      expect(events.onStatus).toHaveBeenLastCalledWith("waiting");
    });
  });

  describe("ending", () => {
    it("tears everything down when the room is closed by the server", async () => {
      const { client, socket, pcs, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });

      socket.fire("room:closed", { interviewId: "interview-1" });

      expect(pcs[0].close).toHaveBeenCalled();
      expect(socket.disconnect).toHaveBeenCalled();
      expect(events.onStatus).toHaveBeenLastCalledWith("closed");
    });

    it("reports replaced when the same user joined elsewhere", async () => {
      const { client, socket, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [] });

      socket.fire("room:replaced", { interviewId: "interview-1" });

      expect(events.onStatus).toHaveBeenLastCalledWith("replaced");
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it("leave() tells the server once, closes media and is idempotent", async () => {
      const { client, socket, pcs, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [peer] });

      client.leave();
      client.leave();

      expect(socket.emit.mock.calls.filter(([e]) => e === "room:leave")).toHaveLength(1);
      expect(pcs[0].close).toHaveBeenCalledTimes(1);
      expect(socket.disconnect).toHaveBeenCalledTimes(1);
    });

    it("does not report reconnecting for a disconnect it caused itself", async () => {
      const { client, socket, events, localStream } = setup();
      await client.join(localStream);
      socket.fire("room:joined", { peers: [] });
      events.onStatus.mockClear();

      client.leave();
      socket.fire("disconnect");

      expect(events.onStatus).not.toHaveBeenCalledWith("reconnecting");
    });
  });
});

describe("createRoomClient", () => {
  it("builds the client matching the provider the backend selected", () => {
    const client = createRoomClient(
      { provider: "p2p", iceServers: [] },
      { interviewId: "interview-1", role: "CANDIDATE" },
      { onStatus: jest.fn(), onRemoteStream: jest.fn() },
    );
    expect(client).toBeInstanceOf(P2pRoomClient);
  });
});
