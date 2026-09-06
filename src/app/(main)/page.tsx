import Link from "next/link";
import { ArrowRight, Building2, Layers, Sparkles } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { CategoryGrid } from "@/components/home/category-grid";
import { CompanyCard } from "@/components/companies/company-card";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getCategories } from "@/lib/services/category.service";
import { getCompanies } from "@/lib/services/company.service";
import { getJobs } from "@/lib/services/job.service";

export default async function HomePage() {
  // Independent data sources — fetched in parallel instead of awaited one
  // after another.
  const [{ items: jobs, meta: jobsMeta }, { items: companies, meta: companiesMeta }, categories, user] =
    await Promise.all([getJobs({ limit: 6 }), getCompanies({ limit: 6 }), getCategories(), getCurrentUser()]);

  const bookmarkedJobIds = user ? await getMyBookmarkedJobIds() : undefined;

  const stats = [
    { icon: Sparkles, value: jobsMeta?.total ?? jobs.length, label: "Việc làm đang tuyển" },
    { icon: Building2, value: companiesMeta?.total ?? companies.length, label: "Công ty tuyển dụng" },
    { icon: Layers, value: categories.length, label: "Ngành nghề" },
  ];

  return (
    <div>
      <section className="bg-hero relative overflow-hidden px-4 pt-14 pb-20 sm:pb-24">
        <div className="from-primary/25 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-hero-foreground text-3xl font-bold sm:text-4xl">Tìm việc IT mơ ước của bạn</h1>
          <p className="text-hero-foreground/70 mt-2">
            Hàng ngàn tin tuyển dụng IT từ các công ty công nghệ hàng đầu
          </p>
          <div className="mt-6">
            <HeroSearch />
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-4xl px-4 sm:-mt-12">
        <div className="bg-card ring-foreground/10 grid grid-cols-3 divide-x rounded-2xl shadow-lg ring-1">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 px-2 py-5 text-center sm:py-6">
              <Icon className="text-primary size-5" />
              <span className="text-xl font-bold sm:text-2xl">{value.toLocaleString("vi-VN")}+</span>
              <span className="text-muted-foreground text-xs sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading title="Việc làm theo ngành nghề" />
          <CategoryGrid categories={categories} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading title="Việc làm nổi bật" href={PATH.JOBS} />
        {jobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} bookmarkedJobIds={bookmarkedJobIds} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Chưa có tin tuyển dụng nào.</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading title="Công ty nổi bật" href={PATH.COMPANIES} />
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

      {user?.role !== "RECRUITER" && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="from-primary/10 via-accent to-primary/5 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r px-6 py-8 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="text-lg font-semibold">Bạn là nhà tuyển dụng?</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Đăng tin tuyển dụng và tiếp cận hàng ngàn ứng viên tiềm năng.
              </p>
            </div>
            <Link href={user ? PATH.RECRUITER_JOBS : PATH.REGISTER}>
              <Button size="lg" className="gap-2">
                Đăng tuyển ngay
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Xem tất cả
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
