import type { InterviewViewerRole, RoomJoinInfo } from "@/lib/types/interview";
import { P2pRoomClient } from "./p2p-room-client";

export type RoomStatus =
  /** Socket / room join in progress, or a peer is there and media is being set up. */
  | "connecting"
  /** In the room, nobody else yet. */
  | "waiting"
  | "connected"
  /** Signaling socket dropped or media path interrupted; trying to recover. */
  | "reconnecting"
  /** The session ended (or the interview finished) — the room is closed. */
  | "closed"
  /** The same user joined from another tab/device. */
  | "replaced"
  | "failed";

export interface RoomClientEvents {
  onStatus(status: RoomStatus, detail?: string): void;
  /** The other participant's media, or null once it goes away. */
  onRemoteStream(stream: MediaStream | null): void;
}

/**
 * One implementation per video technology. The room UI only talks to this
 * interface, so swapping self-hosted WebRTC for a hosted provider means adding
 * a RoomClient and a RoomJoinInfo member — not touching the UI.
 */
export interface RoomClient {
  /** Enter the room and publish `localStream`. Resolves once the join has been started, not when media flows. */
  join(localStream: MediaStream): Promise<void>;
  /** Leave the room and release everything. Safe to call more than once. The local stream is the caller's to stop. */
  leave(): void;
}

export interface RoomClientContext {
  interviewId: string;
  role: InterviewViewerRole;
}

export function createRoomClient(
  join: RoomJoinInfo,
  context: RoomClientContext,
  events: RoomClientEvents,
): RoomClient {
  switch (join.provider) {
    case "p2p":
      return new P2pRoomClient({ ...context, iceServers: join.iceServers, events });
    default: {
      const unsupported: never = join.provider;
      throw new Error(`Unsupported room provider: ${String(unsupported)}`);
    }
  }
}
