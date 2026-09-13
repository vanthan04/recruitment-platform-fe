"use client";

import { io, type Socket } from "socket.io-client";
import { PUBLIC_BACKEND_URL } from "@/lib/constants/service";

let socket: Socket | null = null;

/**
 * Lazily-created singleton, carrying the httpOnly `access_token` cookie via
 * `withCredentials`. See CHAT_INTEGRATION_PLAN.md §5 in the backend repo for
 * why auth works this way for a socket.
 *
 * Connects directly to the backend's own origin (PUBLIC_BACKEND_URL) —
 * frontend (Vercel) and backend (Railway) are different hosts, there's no
 * edge proxy rewriting this to a relative path. The backend's CORS_ORIGIN
 * and cookie `sameSite: 'none'` (see auth.controller.ts) are what make this
 * cross-origin connection work.
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
