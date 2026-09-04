"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CompanyCard } from "@/components/companies/company-card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Company } from "@/lib/types/company";
import type { ListMeta } from "@/lib/types/common";
import { cn } from "@/lib/utils";

interface CompaniesListProps {
  items: Company[];
  meta?: ListMeta;
  initialKeyword: string;
  initialIndustry: string;
}

export function CompaniesList({ items, meta, initialKeyword, initialIndustry }: CompaniesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState(initialKeyword);
  const [industry, setIndustry] = useState(initialIndustry);
  const debouncedKeyword = useDebouncedValue(keyword, 400);
  const debouncedIndustry = useDebouncedValue(industry, 400);

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    if (debouncedKeyword === (searchParams.get("keyword") ?? "")) return;
    pushParams({ keyword: debouncedKeyword || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  useEffect(() => {
    if (debouncedIndustry === (searchParams.get("industry") ?? "")) return;
    pushParams({ industry: debouncedIndustry || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedIndustry]);

  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 -mt-14 grid gap-3 rounded-2xl p-4 shadow-lg ring-1 sm:-mt-16 sm:grid-cols-2">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tên công ty..."
        />
        <Input
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          placeholder="Ngành nghề..."
        />
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", isPending && "opacity-60")}>
        {items.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground col-span-full py-10 text-center text-sm">
            Không tìm thấy công ty phù hợp.
          </p>
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => pushParams({ page: String(next) })}
      />
    </div>
  );
}
