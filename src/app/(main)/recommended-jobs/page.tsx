import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getJobRecommendations } from "@/lib/services/job-recommendation.service";
import { RecommendationsView } from "./recommendations-view";

export default async function RecommendedJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  // Recommendations come from the candidate's own CVs; the backend refuses
  // other roles anyway.
  if (user.role !== "CANDIDATE") redirect(PATH.PROFILE);

  const data = await getJobRecommendations(20);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Việc làm phù hợp với bạn</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Gợi ý từ kỹ năng mà hệ thống đã phân tích được trong CV của bạn.
      </p>
      <RecommendationsView data={data} />
    </div>
  );
}
