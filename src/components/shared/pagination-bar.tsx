import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  /** Client-side navigation — requires the caller to already be a client component. */
  onPageChange?: (page: number) => void;
  /**
   * Renders plain `<a href>` links instead of onClick handlers, so a list
   * with no other client-side state can stay a server component. Takes
   * priority over `onPageChange` if both are somehow passed.
   */
  hrefFor?: (page: number) => string;
}

export function PaginationBar({ page, totalPages, onPageChange, hrefFor }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={prevDisabled}
            className={cn(prevDisabled && "pointer-events-none opacity-50")}
            {...(hrefFor
              ? { href: prevDisabled ? undefined : hrefFor(page - 1) }
              : { onClick: () => onPageChange?.(page - 1) })}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="text-muted-foreground px-3 text-sm">
            Trang {page} / {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            aria-disabled={nextDisabled}
            className={cn(nextDisabled && "pointer-events-none opacity-50")}
            {...(hrefFor
              ? { href: nextDisabled ? undefined : hrefFor(page + 1) }
              : { onClick: () => onPageChange?.(page + 1) })}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
