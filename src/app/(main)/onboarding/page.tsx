import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getProvinces } from "@/lib/services/location.service";
import { needsRecruiterOnboarding } from "@/lib/types/auth";
import { OnboardingForm } from "./onboarding-form";

// Mandatory step for RECRUITER accounts — must finish before reaching
// /recruiter/** or the rest of the app (see login() and recruiter/layout.tsx).
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);
  if (!needsRecruiterOnboarding(user)) redirect(PATH.RECRUITER_JOBS);

  const provinces = await getProvinces();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Hoàn tất hồ sơ nhà tuyển dụng</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Vui lòng điền các thông tin bên dưới để chúng tôi hỗ trợ bạn tốt hơn.
      </p>
      <OnboardingForm user={user} provinces={provinces} />
    </div>
  );
}
