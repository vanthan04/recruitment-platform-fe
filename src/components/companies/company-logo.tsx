import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  name: string;
  logoUrl: string | null;
  className?: string;
}

export function CompanyLogo({ name, logoUrl, className }: CompanyLogoProps) {
  if (logoUrl) {
    // Logos come from arbitrary uploaded URLs; next/image would need every host allow-listed.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={cn("ring-foreground/10 size-10 shrink-0 rounded-md object-cover ring-1", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
