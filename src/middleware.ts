import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "@/lib/middlewares/auth.middleware";
import { withSession } from "@/lib/middlewares/session.middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  await withSession(request, response);
  return withAuth(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
