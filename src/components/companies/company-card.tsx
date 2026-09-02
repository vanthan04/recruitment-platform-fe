import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/companies/company-logo";
import { COMPANY_SIZE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Company } from "@/lib/types/company";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={PATH.COMPANY_DETAIL(company.id)}>
      <Card className="hover:border-primary h-full transition-colors">
        <CardHeader className="flex flex-row items-start gap-3">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} className="size-12" />
          <div className="min-w-0">
            <CardTitle className="line-clamp-1">{company.name}</CardTitle>
            {company.industry && <p className="text-muted-foreground truncate text-sm">{company.industry}</p>}
          </div>
        </CardHeader>
        {(company.size || company.address) && (
          <CardContent className="flex flex-wrap gap-2">
            {company.size && <Badge variant="secondary">{COMPANY_SIZE_LABEL[company.size]}</Badge>}
            {company.address && <Badge variant="outline">{company.address}</Badge>}
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
