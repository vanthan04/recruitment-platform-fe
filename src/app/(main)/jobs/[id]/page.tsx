import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { JobDetail } from "@/components/jobs/job-detail";
import { getJobById } from "@/lib/services/job.service";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await fetchJobOr404(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JobDetail job={job} />
    </div>
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
