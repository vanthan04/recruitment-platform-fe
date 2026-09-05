import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getSkills } from "@/lib/services/skill.service";
import { JobForm } from "../job-form";

// Role check lives in recruiter/layout.tsx — still need the user here for
// the companyId check below.
export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (!user.companyId) redirect(PATH.RECRUITER_COMPANY);

  const [categories, skills] = await Promise.all([getCategories(), getSkills()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Đăng tin tuyển dụng</h1>
      <JobForm mode="create" categories={categories} skills={skills} />
    </div>
  );
}
