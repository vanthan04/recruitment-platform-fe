import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-dashed p-10 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="bg-muted mb-1 flex size-10 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-5" />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
