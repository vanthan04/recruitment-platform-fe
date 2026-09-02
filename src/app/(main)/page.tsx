import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { CompanyCard } from "@/components/companies/company-card";
import { JobCard } from "@/components/jobs/job-card";
import { Badge } from "@/components/ui/badge";
import { PATH } from "@/lib/constants/path";
import { getCategories } from "@/lib/services/category.service";
import { getCompanies } from "@/lib/services/company.service";
import { getJobs } from "@/lib/services/job.service";

export default async function HomePage() {
  // Three independent data sources — fetched in parallel instead of
  // awaited one after another.
  const [{ items: jobs }, { items: companies }, categories] = await Promise.all([
    getJobs({ limit: 6 }),
    getCompanies({ limit: 6 }),
    getCategories(),
  ]);

  return (
    <div>
      <section className="bg-primary/5 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Tìm việc làm mơ ước của bạn</h1>
          <p className="text-muted-foreground mt-2">Hàng ngàn tin tuyển dụng từ các công ty hàng đầu</p>
          <div className="mt-6">
            <HeroSearch />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={`${PATH.JOBS}?categoryId=${category.id}`}>
                <Badge variant="secondary" className="px-3 py-1.5">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Việc làm nổi bật</h2>
          <Link href={PATH.JOBS} className="text-primary text-sm hover:underline">
            Xem tất cả
          </Link>
        </div>
        {jobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Chưa có tin tuyển dụng nào.</p>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Công ty nổi bật</h2>
          <Link href={PATH.COMPANIES} className="text-primary text-sm hover:underline">
            Xem tất cả
          </Link>
        </div>
        {companies.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Chưa có công ty nào.</p>
        )}
      </section>
    </div>
  );
}
