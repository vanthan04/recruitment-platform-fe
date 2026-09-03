import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCompanyById } from "@/lib/services/company.service";
import { CompanyForm } from "./company-form";
import { CompanyLogoUpload } from "./company-logo-upload";
import { DeleteCompanyButton } from "./delete-company-button";

export default async function RecruiterCompanyPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  // user.companyId can point at a company the recruiter just deleted —
  // deleting only soft-deletes the Company row, it doesn't clear
  // companyId off the user. Treat a 404 here the same as "no company yet"
  // instead of crashing, so a deleted recruiter can create a new one.
  const company = user.companyId ? await getCompanyOr404(user.companyId) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Công ty của tôi</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {company ? "Cập nhật thông tin công ty của bạn." : "Tạo hồ sơ công ty trước khi đăng tin tuyển dụng."}
      </p>

      {company && (
        <div className="mb-6">
          <CompanyLogoUpload companyId={company.id} companyName={company.name} logoUrl={company.logoUrl} />
        </div>
      )}

      <CompanyForm mode={company ? "edit" : "create"} company={company ?? undefined} />

      {company && (
        <div className="mt-6 border-t pt-6">
          <DeleteCompanyButton companyId={company.id} />
        </div>
      )}
    </div>
  );
}

async function getCompanyOr404(id: string) {
  try {
    return await getCompanyById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
