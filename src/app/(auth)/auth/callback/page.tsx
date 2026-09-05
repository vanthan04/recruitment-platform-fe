import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { completeSocialLogin } from "@/lib/services/auth.service";

interface AuthCallbackPageProps {
  searchParams: Promise<{ code?: string; error?: string }>;
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const { code, error } = await searchParams;

  if (error) {
    redirect(`${PATH.LOGIN}?error=${error}`);
  }
  if (!code) {
    redirect(PATH.LOGIN);
  }

  await completeSocialLogin(code);
  return null;
}
