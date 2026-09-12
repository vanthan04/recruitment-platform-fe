"use client";

import { Building2 } from "lucide-react";
import { CompanyCard } from "@/components/companies/company-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePushParams, useDebouncedUrlFilter } from "@/hooks/use-url-filter";
import type { Company } from "@/lib/types/company";
import type { ListMeta } from "@/lib/types/common";
import { cn } from "@/lib/utils";

interface CompaniesListProps {
  items: Company[];
  meta?: ListMeta;
  initialKeyword: string;
}

export function CompaniesList({ items, meta, initialKeyword }: CompaniesListProps) {
  const { pushParams, searchParams, isPending } = usePushParams();

  const [keyword, setKeyword] = useDebouncedUrlFilter("keyword", initialKeyword, pushParams, searchParams);

  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 -mt-14 rounded-2xl p-4 shadow-lg ring-1 sm:-mt-16">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tên công ty..."
        />
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", isPending && "opacity-60")}>
        {items.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
        {items.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Không tìm thấy công ty phù hợp"
            description="Thử điều chỉnh từ khoá tìm kiếm."
            className="col-span-full"
          />
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
