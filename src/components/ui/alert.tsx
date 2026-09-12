import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva("w-full rounded-lg border p-3 text-sm", {
  variants: {
    variant: {
      default: "border-primary/30 bg-primary/5",
      destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={variant}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, alertVariants };
