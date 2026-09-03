import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCompanyById } from "@/lib/services/company.service";
import { CompanyForm } from "./company-form";
import { CompanyLogoUpload } from "./company-logo-upload";

export default async function RecruiterCompanyPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  const company = user.companyId ? await getCompanyById(user.companyId) : null;

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
    </div>
  );
}
