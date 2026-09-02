"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/lib/services/bookmark.service";
import { cn } from "@/lib/utils";

interface SaveJobButtonProps {
  jobId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function SaveJobButton({ jobId, initialBookmarked = false, className }: SaveJobButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent) {
    // JobCard renders this inside a Link — don't navigate on click.
    event.preventDefault();
    event.stopPropagation();

    startTransition(async () => {
      const result = await toggleBookmark(jobId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setIsBookmarked(result.bookmarked);
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
