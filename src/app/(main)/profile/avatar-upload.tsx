"use client";

import { useRef } from "react";
import { CompanyLogo } from "@/components/companies/company-logo";
import { useApiToast } from "@/hooks/use-api-toast";
import { updateAvatar } from "@/lib/services/auth.service";

interface AvatarUploadProps {
  fullName: string;
  avatarUrl: string | null;
}

export function AvatarUpload({ fullName, avatarUrl }: AvatarUploadProps) {
  const { run, isPending } = useApiToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    run(() => updateAvatar(formData), { successMessage: "Cập nhật ảnh đại diện thành công." });
    event.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <CompanyLogo name={fullName} logoUrl={avatarUrl} className="size-16 text-xl" />
      <div>
        <button
          type="button"
          className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Đang tải lên..." : "Đổi ảnh đại diện"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
