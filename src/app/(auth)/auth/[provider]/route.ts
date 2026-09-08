import { NextRequest, NextResponse } from "next/server";
import { API_PREFIX, BACKEND_URL } from "@/lib/constants/service";

const PROVIDERS = new Set(["google", "facebook"]);

// Server-side redirect so the browser only ever links to a same-origin path
// (/auth/google, /auth/facebook) — the real backend origin (BACKEND_URL)
// stays server-only instead of needing a NEXT_PUBLIC_ variable. The browser
// still leaves the app entirely from here (full-page redirect chain through
// the real backend, then Google/Facebook, then back), same as before.
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ message: "Unknown provider" }, { status: 404 });
  }

  const role = request.nextUrl.searchParams.get("role") ?? "CANDIDATE";
  return NextResponse.redirect(`${BACKEND_URL}${API_PREFIX}/auth/${provider}?role=${role}`);
}
