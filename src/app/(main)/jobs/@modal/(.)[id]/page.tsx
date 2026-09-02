import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { JobDetail } from "@/components/jobs/job-detail";
import { JobModal } from "@/components/jobs/job-modal";
import { getJobById } from "@/lib/services/job.service";

interface JobDetailModalProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailModal({ params }: JobDetailModalProps) {
  const { id } = await params;
  const job = await fetchJobOr404(id);

  return (
    <JobModal>
      <JobDetail job={job} />
    </JobModal>
  );
}

async function fetchJobOr404(id: string) {
  try {
    return await getJobById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
