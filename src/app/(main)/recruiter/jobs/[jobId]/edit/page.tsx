import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getJobById } from "@/lib/services/job.service";
import { getSkills } from "@/lib/services/skill.service";
import { JobForm } from "../../job-form";

// Role check lives in recruiter/layout.tsx — still need the user here for
// the ownership check below.
export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { jobId } = await params;
  const [job, categories, skills] = await Promise.all([getJobById(jobId), getCategories(), getSkills()]);
  if (job.companyId !== user.companyId) redirect(PATH.RECRUITER_JOBS);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Chỉnh sửa tin tuyển dụng</h1>
      <JobForm mode="edit" job={job} categories={categories} skills={skills} />
    </div>
  );
}
