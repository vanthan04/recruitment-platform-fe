import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/shared/back-link";
import { InterviewInfo } from "@/components/shared/interview-info";
import { ApiError } from "@/lib/api/error";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getInterview, getInterviewSessions } from "@/lib/services/interview.service";
import { SessionPanel } from "./session-panel";

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { id } = await params;
  try {
    const [interview, sessions] = await Promise.all([getInterview(id), getInterviewSessions(id)]);

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <BackLink href={PATH.INTERVIEWS} label="Quay lại lịch phỏng vấn" />
        <h1 className="text-2xl font-semibold">{interview.jobTitle}</h1>
        {interview.viewerRole === "RECRUITER" && (
          <p className="text-muted-foreground mt-1 text-sm">
            Ứng viên: {interview.candidateName ?? "Chưa cập nhật tên"}
          </p>
        )}
        <InterviewInfo interview={interview} showDetailLink={false} />
        <SessionPanel interview={interview} sessions={sessions} />
      </div>
    );
  } catch (error) {
    // Not found and "not a participant" look the same to the visitor — the
    // page must not confirm that an interview id exists.
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
}
