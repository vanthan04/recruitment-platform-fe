"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getUnreadMessageCount } from "@/lib/services/chat.service";
import {
  UNREAD_MESSAGES_CHANGED_EVENT,
  getUnreadMessageCountSnapshot,
  setUnreadMessageCount,
  subscribeUnreadMessageCount,
} from "@/lib/realtime/unread-messages";

/**
 * Renders nothing; mounted once in the header to keep the shared unread
 * count fresh. The header lives outside ChatProvider (and the socket), so it
 * refetches on the moments the count can plausibly have changed instead:
 * - the chat code announces it (new incoming message, conversation read),
 * - the tab regains focus/visibility (messages arrived while away),
 * - the user navigates to another page.
 */
export function UnreadMessagesSync({ initialCount }: { initialCount: number }) {
  const pathname = usePathname();
  const isFirstPathname = useRef(true);
  // Responses can come back out of order — only the latest request may win.
  const latestRequest = useRef(0);

  // Adopt the server-rendered value whenever the layout re-renders with a
  // new one (e.g. after router.refresh()).
  useEffect(() => {
    setUnreadMessageCount(initialCount);
  }, [initialCount]);

  const refresh = useCallback(async () => {
    const request = ++latestRequest.current;
    const count = await getUnreadMessageCount();
    if (request === latestRequest.current) setUnreadMessageCount(count);
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") void refresh();
    }
    window.addEventListener(UNREAD_MESSAGES_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener(UNREAD_MESSAGES_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    // The first run is the initial render, which already has the server's value.
    if (isFirstPathname.current) {
      isFirstPathname.current = false;
      return;
    }
    void refresh();
  }, [pathname, refresh]);

  return null;
}

/** Small count pill for a nav item. Hidden at zero. */
export function UnreadMessagesBadge({ initialCount }: { initialCount: number }) {
  const shared = useSyncExternalStore(
    subscribeUnreadMessageCount,
    getUnreadMessageCountSnapshot,
    // Server render / hydration: no store yet — use what the layout passed in.
    () => null,
  );
  const count = shared ?? initialCount;

  if (count <= 0) return null;

  return (
    <>
      <span
        aria-hidden
        className="bg-destructive ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium text-white"
      >
        {count > 9 ? "9+" : count}
      </span>
      <span className="sr-only">{count} tin nhắn chưa đọc</span>
    </>
  );
}
