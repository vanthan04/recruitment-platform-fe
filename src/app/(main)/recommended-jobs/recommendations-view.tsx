import Link from "next/link";
import { FileText, SearchX, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecommendedJobCard } from "@/components/jobs/recommended-job-card";
import { PATH } from "@/lib/constants/path";
import type { JobRecommendations } from "@/lib/types/job-recommendation";

/**
 * The body of the recommendations page, kept apart from the (server) page so
 * each of its states can be tested: no analyzed CV yet, an analyzed CV with no
 * skills found, nothing matching, and the list itself.
 */
export function RecommendationsView({ data }: { data: JobRecommendations }) {
  if (!data.hasAnalyzedCv) {
    return (
      <EmptyState
        icon={FileText}
        title="Cần một CV đã được phân tích"
        description="Gợi ý dựa trên kỹ năng trong CV của bạn. Hãy tải lên và xuất bản một CV — hệ thống sẽ tự phân tích trong vài phút."
        action={
          <Button asChild>
            <Link href={PATH.CV_LIST}>Đến trang CV</Link>
          </Button>
        }
      />
    );
  }

  if (data.candidateSkills.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="CV của bạn chưa cho thấy kỹ năng nào"
        description="Hệ thống không tìm thấy kỹ năng cụ thể trong CV đã phân tích. Hãy cập nhật CV với các công nghệ bạn dùng (ví dụ: React, NestJS, PostgreSQL)."
        action={
          <Button asChild variant="outline">
            <Link href={PATH.CV_LIST}>Đến trang CV</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">Dựa trên kỹ năng trong CV của bạn:</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Kỹ năng của bạn">
          {data.candidateSkills.map((skill) => (
            <li key={skill}>
              <Badge variant="outline" className="rounded-full">
                {skill}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Chưa có việc làm nào khớp kỹ năng của bạn"
          description="Các việc làm bạn đã ứng tuyển không hiện ở đây. Hãy quay lại sau, hoặc tự tìm trong danh sách việc làm."
          action={
            <Button asChild variant="outline">
              <Link href={PATH.JOBS}>Tìm việc làm</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Việc làm được gợi ý">
          {data.items.map((recommendation) => (
            <li key={recommendation.job.id}>
              <RecommendedJobCard recommendation={recommendation} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Sparkles className="size-3.5" />
        Xếp theo mức độ khớp kỹ năng; không gồm việc làm bạn đã ứng tuyển.
      </p>
    </div>
  );
}
