import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  icon?: LucideIcon;
  value: ReactNode;
  label: string;
  className?: string;
}

export function StatTile({ icon: Icon, value, label, className }: StatTileProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-1 py-2 text-center">
        {Icon && <Icon className="text-primary size-5" />}
        <span className="text-xl font-bold">{value}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </CardContent>
    </Card>
  );
}
