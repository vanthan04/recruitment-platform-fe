import { redirect } from "next/navigation";
import { JobCard } from "@/components/jobs/job-card";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobs } from "@/lib/services/bookmark.service";

export default async function SavedJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const jobs = await getMyBookmarkedJobs();
  const bookmarkedJobIds = new Set(jobs.map((job) => job.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Việc làm đã lưu</h1>
      {jobs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} bookmarkedJobIds={bookmarkedJobIds} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Bạn chưa lưu tin tuyển dụng nào.</p>
      )}
    </div>
  );
}
