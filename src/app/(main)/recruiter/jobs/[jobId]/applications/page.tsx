import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getApplicationsForJob } from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";
import { formatRelativeDate } from "@/lib/utils";
import { ApplicationActions } from "./application-actions";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function RecruiterJobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  const { jobId } = await params;
  // The backend rejects this for non-owners (403) — surfaced via the route's
  // error boundary, same as every other data-loading page in this app.
  const [job, applications] = await Promise.all([getJobById(jobId), getApplicationsForJob(jobId)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Ứng viên</h1>
      <p className="text-muted-foreground mb-6 text-sm">{job.title}</p>

      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Avatar>
                {application.candidate?.avatarUrl && (
                  <AvatarImage src={application.candidate.avatarUrl} alt={application.candidate.fullName} />
                )}
                <AvatarFallback>{initials(application.candidate?.fullName ?? "?")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{application.candidate?.fullName ?? "Ứng viên"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
                    {APPLICATION_STATUS_LABEL[application.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    Ứng tuyển {formatRelativeDate(application.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <ApplicationActions application={application} />
          </div>
        ))}
        {applications.length === 0 && (
          <p className="text-muted-foreground text-sm">Chưa có ứng viên nào cho tin tuyển dụng này.</p>
        )}
      </div>
    </div>
  );
}
