import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";

// Single RECRUITER-only guard for the whole /recruiter/** segment — every
// page under here used to repeat this check individually.
export default async function RecruiterLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  return <>{children}</>;
}
