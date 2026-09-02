import "server-only";
import { cookies, headers } from "next/headers";

export async function getCookies() {
  return cookies();
}

export async function getHeaders() {
  return headers();
}

export async function getForwardedHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const forwarded: Record<string, string> = {};
  const userAgent = incoming.get("user-agent");
  const forwardedFor = incoming.get("x-forwarded-for");

  if (userAgent) forwarded["user-agent"] = userAgent;
  if (forwardedFor) forwarded["x-forwarded-for"] = forwardedFor;

  return forwarded;
}
