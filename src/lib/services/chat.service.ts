"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { CHAT_ENDPOINT, FILE_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { Conversation, CreateMessageInput, Message, MessagePage } from "@/lib/types/chat";

export async function getMyConversations(
  page = 1,
  limit = 20,
): Promise<{ items: Conversation[]; metadata?: ListMeta }> {
  return api.getPaginated<Conversation[]>(CHAT_ENDPOINT.CONVERSATIONS, { searchParams: { page, limit } });
}

export async function getConversation(id: string): Promise<Conversation> {
  return api.get<Conversation>(CHAT_ENDPOINT.CONVERSATION_DETAIL(id));
}

export async function getMessages(conversationId: string, cursor?: string, limit = 30): Promise<MessagePage> {
  const { items, metadata } = await api.getPaginated<Message[], { nextCursor: string | null }>(
    CHAT_ENDPOINT.MESSAGES(conversationId),
    { searchParams: { cursor, limit } },
  );
  return { items, nextCursor: metadata?.nextCursor ?? null };
}

// REST fallback for sending — the primary path is the live WebSocket
// (see lib/realtime/socket.ts), used from client components directly so it
// isn't gated behind a server round-trip. This covers the case where the
// socket isn't connected yet. Both paths hit the same backend handler and
// are deduped by `clientMessageId`, so retrying here is always safe.
export async function sendMessageFallback(
  conversationId: string,
  input: CreateMessageInput,
): Promise<Message> {
  return api.post<Message>(CHAT_ENDPOINT.MESSAGES(conversationId), input);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(CHAT_ENDPOINT.READ(conversationId));
  revalidatePath(PATH.MESSAGES);
}

// Same generic upload endpoint avatar/CV upload already use — just a
// different `folder`. Called directly from the client MessageInput (Next
// lets a client component invoke a "use server" action as an RPC).
//
// Unlike avatars/CVs, `chat-attachments` is a *private* folder on the
// backend (it can carry résumés/offer letters) — the endpoint stores the
// file privately and returns an opaque storage `key`, never a public `url`.
// That key is only ever exchanged for a short-lived signed URL by the
// backend when a conversation member reads the message it ends up attached
// to; never construct a fetchable URL from it here.
export async function uploadChatAttachment(formData: FormData): Promise<{ key: string }> {
  formData.set("folder", "chat-attachments");
  return api.postForm<{ key: string }>(FILE_ENDPOINT.UPLOAD, formData);
}

// Recruiter-only — creates (or resumes) the conversation for an accepted
// application, then takes the recruiter straight into it.
export async function startConversationAndRedirect(applicationId: string): Promise<never> {
  const conversation = await api.post<Conversation>(CHAT_ENDPOINT.CONVERSATIONS, { applicationId });
  redirect(`${PATH.MESSAGES}?conversationId=${conversation.id}`);
}
