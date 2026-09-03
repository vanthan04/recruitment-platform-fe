"use client";

import { useRef } from "react";
import { CompanyLogo } from "@/components/companies/company-logo";
import { useApiToast } from "@/hooks/use-api-toast";
import { uploadCompanyLogo } from "@/lib/services/company.service";

interface CompanyLogoUploadProps {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
}

export function CompanyLogoUpload({ companyId, companyName, logoUrl }: CompanyLogoUploadProps) {
  const { run, isPending } = useApiToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    run(() => uploadCompanyLogo(companyId, formData), { successMessage: "Cập nhật logo thành công." });
    event.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <CompanyLogo name={companyName} logoUrl={logoUrl} className="size-16 text-xl" />
      <div>
        <button
          type="button"
          className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Đang tải lên..." : "Đổi logo"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
