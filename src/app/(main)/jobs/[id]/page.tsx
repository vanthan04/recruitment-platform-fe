import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetail } from "@/components/jobs/job-detail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PATH } from "@/lib/constants/path";
import { getRelatedJobs } from "@/lib/services/job.service";
import { getJobDetailProps } from "../get-job-detail-props";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const props = await getJobDetailProps(id);
  const relatedJobs = await getRelatedJobs(props.job);
  const { job } = props;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="text-muted-foreground mb-5 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href={PATH.HOME} className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={PATH.JOBS} className="hover:text-foreground">
          Việc làm
        </Link>
        {job.category && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <Link href={`${PATH.JOBS}?categoryId=${job.category.id}`} className="hover:text-foreground">
              {job.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-foreground line-clamp-1">{job.title}</span>
      </nav>

      <Tabs defaultValue="detail">
        <TabsList variant="line" className="mb-6 border-b">
          <TabsTrigger value="detail" className="px-1 text-base">
            Chi tiết tin tuyển dụng
          </TabsTrigger>
          {relatedJobs.length > 0 && (
            <TabsTrigger value="related" className="px-1 text-base">
              Việc làm liên quan
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="detail">
          <JobDetail {...props} />
        </TabsContent>

        {relatedJobs.length > 0 && (
          <TabsContent value="related">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedJobs.map((relatedJob) => (
                <JobCard key={relatedJob.id} job={relatedJob} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
