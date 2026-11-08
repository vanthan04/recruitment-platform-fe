"use client";

/**
 * Tiny shared store for the header's unread-messages count.
 *
 * The header sits outside ChatProvider (which is mounted only under
 * /messages), and the nav renders the badge in two places (desktop nav and
 * the mobile panel). A module-level store lets both read one value that a
 * single <UnreadMessagesSync /> keeps fresh, without needing the socket or
 * the chat context to be in scope.
 */

/** Dispatched on `window` whenever the unread total may have changed. */
export const UNREAD_MESSAGES_CHANGED_EVENT = "chat:unread-changed";

export function notifyUnreadMessagesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNREAD_MESSAGES_CHANGED_EVENT));
}

type Listener = () => void;

// `null` until something sets it — readers fall back to the count the
// server rendered into the page.
let current: number | null = null;
const listeners = new Set<Listener>();

export function setUnreadMessageCount(count: number): void {
  if (count === current) return;
  current = count;
  for (const listener of listeners) listener();
}

export function subscribeUnreadMessageCount(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUnreadMessageCountSnapshot(): number | null {
  return current;
}
