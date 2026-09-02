import { notFound, redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCvById } from "@/lib/services/cv.service";
import { CvForm } from "../../cv-form";

interface EditCvPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCvPage({ params }: EditCvPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { id } = await params;
  const cv = await getCvById(id);
  if (!cv) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Chỉnh sửa CV</h1>
      <CvForm cv={cv} />
    </div>
  );
}
