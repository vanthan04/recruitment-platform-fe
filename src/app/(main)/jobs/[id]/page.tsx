import { JobCard } from "@/components/jobs/job-card";
import { JobDetail } from "@/components/jobs/job-detail";
import { getRelatedJobs } from "@/lib/services/job.service";
import { getJobDetailProps } from "../get-job-detail-props";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const props = await getJobDetailProps(id);
  const relatedJobs = await getRelatedJobs(props.job);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <JobDetail {...props} />

      {relatedJobs.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Việc làm liên quan</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
