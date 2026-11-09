"use client";

import { io, type Socket } from "socket.io-client";
import { PUBLIC_BACKEND_URL } from "@/lib/constants/service";

/**
 * A fresh signaling socket for one room visit (unlike the shared chat socket).
 * Same cookie-based auth and cross-origin setup as the chat socket — see
 * getChatSocket — but on the backend's separate `/rtc` namespace, which only
 * relays WebRTC signaling; media never goes through it.
 */
export function createRoomSocket(): Socket {
  return io(PUBLIC_BACKEND_URL ? `${PUBLIC_BACKEND_URL}/rtc` : "/rtc", {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
}
