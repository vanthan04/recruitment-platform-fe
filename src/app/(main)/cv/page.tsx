import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyCvs } from "@/lib/services/cv.service";
import { DeleteCvButton, DownloadCvButton, PublishCvButton } from "./cv-actions";

export default async function CvListPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const cvs = await getMyCvs();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CV của tôi</h1>
        <Button asChild>
          <Link href={PATH.CV_NEW}>Tạo CV mới</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {cvs.map((cv) => (
          <div
            key={cv.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div>
              <Link href={PATH.CV_EDIT(cv.id)} className="font-medium hover:underline">
                {cv.title}
              </Link>
              <div className="mt-1">
                <Badge variant={cv.status === "PUBLISHED" ? "default" : "secondary"}>
                  {cv.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DownloadCvButton cvId={cv.id} />
              {cv.status === "DRAFT" && <PublishCvButton cvId={cv.id} />}
              <DeleteCvButton cvId={cv.id} />
            </div>
          </div>
        ))}
        {cvs.length === 0 && <p className="text-muted-foreground text-sm">Bạn chưa có CV nào.</p>}
      </div>
    </div>
  );
}
