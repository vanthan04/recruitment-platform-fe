import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getJobById } from "@/lib/services/job.service";
import { JobForm } from "../../job-form";

export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  const { jobId } = await params;
  const [job, categories] = await Promise.all([getJobById(jobId), getCategories()]);
  if (job.companyId !== user.companyId) redirect(PATH.RECRUITER_JOBS);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Chỉnh sửa tin tuyển dụng</h1>
      <JobForm mode="edit" job={job} categories={categories} />
    </div>
  );
}
