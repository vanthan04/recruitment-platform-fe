import { JobDetail } from "@/components/jobs/job-detail";
import { getJobDetailProps } from "../get-job-detail-props";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const props = await getJobDetailProps(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JobDetail {...props} />
    </div>
  );
}
