import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { JobForm } from "../job-form";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);
  if (!user.companyId) redirect(PATH.RECRUITER_COMPANY);

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Đăng tin tuyển dụng</h1>
      <JobForm mode="create" categories={categories} />
    </div>
  );
}
