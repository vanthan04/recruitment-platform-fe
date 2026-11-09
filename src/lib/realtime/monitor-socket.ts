"use client";

import { io, type Socket } from "socket.io-client";
import { PUBLIC_BACKEND_URL } from "@/lib/constants/service";

/**
 * Socket for AI monitoring frames — the backend's `/monitor` namespace, same
 * cookie auth as the chat and room sockets. Frames go to the backend only; the
 * browser never talks to the AI service.
 */
export function createMonitorSocket(): Socket {
  return io(PUBLIC_BACKEND_URL ? `${PUBLIC_BACKEND_URL}/monitor` : "/monitor", {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
}
