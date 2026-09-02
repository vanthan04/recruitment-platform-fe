"use client";

import { io, type Socket } from "socket.io-client";
import { PUBLIC_BACKEND_URL } from "@/lib/constants/service";

let socket: Socket | null = null;

/**
 * Lazily-created singleton — the socket is opened directly from the browser
 * to the backend origin (not through Next's server), carrying the httpOnly
 * `access_token` cookie via `withCredentials`. See CHAT_INTEGRATION_PLAN.md
 * §5 in the backend repo for why auth works this way for a socket.
 */
export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(`${PUBLIC_BACKEND_URL}/ws`, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return socket;
}
