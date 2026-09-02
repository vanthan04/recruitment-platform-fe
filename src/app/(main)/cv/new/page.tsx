import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { CvForm } from "../cv-form";

export default async function NewCvPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Tạo CV mới</h1>
      <CvForm />
    </div>
  );
}
