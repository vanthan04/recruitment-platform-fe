import { CompaniesList } from "@/app/(main)/companies/companies-list";
import { getCompanies } from "@/lib/services/company.service";

interface CompaniesPageProps {
  searchParams: Promise<{ page?: string; keyword?: string; industry?: string }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const { items, meta } = await getCompanies({ page, keyword: sp.keyword, industry: sp.industry });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Công ty</h1>
      <CompaniesList
        items={items}
        meta={meta}
        initialKeyword={sp.keyword ?? ""}
        initialIndustry={sp.industry ?? ""}
      />
    </div>
  );
}
