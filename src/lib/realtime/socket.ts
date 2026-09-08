"use client";

import { io, type Socket } from "socket.io-client";
import { PUBLIC_BACKEND_URL } from "@/lib/constants/service";

let socket: Socket | null = null;

/**
 * Lazily-created singleton, carrying the httpOnly `access_token` cookie via
 * `withCredentials`. See CHAT_INTEGRATION_PLAN.md §5 in the backend repo for
 * why auth works this way for a socket.
 *
 * In production this connects with a relative path — same origin as the
 * page — because the Cloudflare edge in front of the public domain routes
 * /socket.io to the backend (see recruitment-platform-edge). PUBLIC_BACKEND_URL
 * is only ever set locally, where `next dev` has no such edge in front of it.
 */
export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(PUBLIC_BACKEND_URL ? `${PUBLIC_BACKEND_URL}/ws` : "/ws", {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return socket;
}
