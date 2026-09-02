"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { toggleBookmark } from "@/lib/services/bookmark.service";
import { cn } from "@/lib/utils";

interface SaveJobButtonProps {
  jobId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function SaveJobButton({ jobId, initialBookmarked = false, className }: SaveJobButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const { run, isPending } = useApiToast();

  function handleClick(event: React.MouseEvent) {
    // JobCard renders this inside a Link — don't navigate on click.
    event.preventDefault();
    event.stopPropagation();

    const next = !isBookmarked;
    setIsBookmarked(next); // optimistic update

    run(() => toggleBookmark(jobId), {
      successMessage: next ? "Đã lưu tin." : "Đã bỏ lưu tin.",
      onError: () => setIsBookmarked(isBookmarked), // revert on failure
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={isBookmarked ? "Bỏ lưu tin" : "Lưu tin"}
      disabled={isPending}
      className={cn(className)}
      onClick={handleClick}
    >
      {isBookmarked ? <BookmarkCheck className="text-primary size-4" /> : <Bookmark className="size-4" />}
    </Button>
  );
}
