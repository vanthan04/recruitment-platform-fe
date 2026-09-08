import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { completeSocialLogin } from "@/lib/services/auth.service";

// A Route Handler, not a page — completeSocialLogin() sets the access/refresh
// token cookies, and Next.js only allows cookies().set() from a Server Action
// or a Route Handler, never from a plain Server Component render. This used
// to be callback/page.tsx, which crashed on that restriction before the
// cookies (or the redirect past this route) ever took effect.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    redirect(`${PATH.LOGIN}?error=${error}`);
  }
  if (!code) {
    redirect(PATH.LOGIN);
  }

  await completeSocialLogin(code);
}
