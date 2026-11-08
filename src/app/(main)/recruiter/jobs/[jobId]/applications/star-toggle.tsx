"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { setApplicationStarred } from "@/lib/services/job-application.service";
import { cn } from "@/lib/utils";

/**
 * Stars / unstars an applicant — a private bookmark for the job's recruiter,
 * never shown to the candidate. Flips at once and flips back if the backend
 * refuses. `onChange` lets a parent (the board) re-sort while waiting.
 */
export function StarToggle({
  applicationId,
  starred: serverStarred,
  candidateName,
  onChange,
}: {
  applicationId: string;
  starred: boolean;
  candidateName: string;
  onChange?: (starred: boolean) => void;
}) {
  const router = useRouter();
  const { run } = useApiToast();
  const [starred, setStarred] = useState(serverStarred);
  const [pending, setPending] = useState(false);

  // Take the server's value when it changes (after router.refresh()).
  useEffect(() => setStarred(serverStarred), [serverStarred]);

  function apply(value: boolean) {
    setStarred(value);
    onChange?.(value);
  }

  function toggle() {
    if (pending) return;
    const next = !starred;
    apply(next);
    setPending(true);
    run(() => setApplicationStarred(applicationId, next), {
      onSuccess: () => {
        setPending(false);
        router.refresh();
      },
      onError: () => {
        apply(!next);
        setPending(false);
      },
    });
  }

  const label = starred ? `Bỏ đánh dấu sao ${candidateName}` : `Đánh dấu sao ${candidateName}`;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-pressed={starred}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={toggle}
    >
      <Star className={cn(starred ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} />
    </Button>
  );
}
