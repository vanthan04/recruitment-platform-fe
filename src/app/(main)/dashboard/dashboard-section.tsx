import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DashboardLink {
  icon: LucideIcon;
  label: string;
  // Omit href for menu items that mirror TopCV's account menu but have no
  // page built yet — they render disabled with a "Sắp có" badge instead.
  href?: string;
  count?: number;
}

export function DashboardSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: DashboardLink[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="text-primary size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        {items.map((item) => {
          const inner = (
            <>
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <Badge variant="secondary">{item.count}</Badge>
              )}
              {!item.href && (
                <Badge variant="outline" className="text-muted-foreground">
                  Sắp có
                </Badge>
              )}
            </>
          );

          if (!item.href) {
            return (
              <div
                key={item.label}
                aria-disabled
                className="text-muted-foreground/60 flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
            >
              {inner}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
