import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/companies/company-logo";
import { COMPANY_SIZE_LABEL, COMPANY_TYPE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Company } from "@/lib/types/company";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={PATH.COMPANY_DETAIL(company.id)} className="block h-full">
      <Card className="border-border hover:border-primary h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm transition-all hover:shadow-md">
        <div className="from-primary/15 via-primary/5 h-14 bg-gradient-to-r to-transparent" />
        <CardHeader className="-mt-7 flex flex-row items-start gap-3 pb-3">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logoUrl}
            className="ring-card size-14 rounded-xl bg-white ring-4"
          />
          <div className="mt-7 min-w-0">
            <CardTitle className="line-clamp-1">{company.name}</CardTitle>
          </div>
        </CardHeader>
        {(company.companyType || company.size || company.address) && (
          <CardContent className="flex flex-wrap gap-2 pb-4">
            {company.companyType && (
              <Badge variant="default" className="rounded-full">
                {COMPANY_TYPE_LABEL[company.companyType]}
              </Badge>
            )}
            {company.size && (
              <Badge variant="secondary" className="rounded-full">
                {COMPANY_SIZE_LABEL[company.size]}
              </Badge>
            )}
            {company.address && (
              <Badge variant="outline" className="rounded-full">
                {company.address}
              </Badge>
            )}
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
