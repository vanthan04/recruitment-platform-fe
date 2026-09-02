import { JobDetail } from "@/components/jobs/job-detail";
import { JobModal } from "@/components/jobs/job-modal";
import { getJobDetailProps } from "../../get-job-detail-props";

interface JobDetailModalProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailModal({ params }: JobDetailModalProps) {
  const { id } = await params;
  const props = await getJobDetailProps(id);

  return (
    <JobModal>
      <JobDetail {...props} />
    </JobModal>
  );
}
