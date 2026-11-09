import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/shared/back-link";
import { ApiError } from "@/lib/api/error";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getInterview } from "@/lib/services/interview.service";
import { NON_TERMINAL_INTERVIEW_STATUSES } from "@/lib/types/interview";
import { RoomView } from "./room-view";

export default async function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { id } = await params;
  let interview;
  try {
    interview = await getInterview(id);
  } catch (error) {
    // Not found and "not a participant" look the same to the visitor.
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }

  // Nothing to do here for an interview held elsewhere or already over.
  if (!interview.useRoom || !NON_TERMINAL_INTERVIEW_STATUSES.includes(interview.status)) {
    redirect(PATH.INTERVIEW_DETAIL(id));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BackLink href={PATH.INTERVIEW_DETAIL(id)} label="Quay lại buổi phỏng vấn" />
      <h1 className="mb-4 text-2xl font-semibold">{interview.jobTitle}</h1>
      <RoomView interview={interview} />
    </div>
  );
}
