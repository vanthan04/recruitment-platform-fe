import { CompaniesList } from "@/app/(main)/companies/companies-list";
import { getCompanies } from "@/lib/services/company.service";

interface CompaniesPageProps {
  searchParams: Promise<{ page?: string; keyword?: string }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const { items, meta } = await getCompanies({ page, keyword: sp.keyword });

  return (
    <div>
      <div className="bg-primary/5 border-b py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-semibold sm:text-3xl">Công ty</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {(meta?.total ?? items.length).toLocaleString("vi-VN")} công ty đang tuyển dụng
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <CompaniesList items={items} meta={meta} initialKeyword={sp.keyword ?? ""} />
      </div>
    </div>
  );
}
