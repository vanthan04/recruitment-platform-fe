import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { needsRecruiterOnboarding } from "@/lib/types/auth";

// Single RECRUITER-only guard for the whole /recruiter/** segment — every
// page under here used to repeat this check individually.
export default async function RecruiterLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);
  // Covers a recruiter deep-linking into /recruiter/** without having gone
  // through the login redirect in auth.service.ts's login() first.
  if (needsRecruiterOnboarding(user)) redirect(PATH.ONBOARDING);

  return <>{children}</>;
}
