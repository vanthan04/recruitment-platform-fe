"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants/path";

interface ShareJobButtonsProps {
  jobId: string;
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94Z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.8 22H2.5l7.7-8.8L1 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 4H5.5l12.2 16Z" />
    </svg>
  );
}

export function ShareJobButtons({ jobId }: ShareJobButtonsProps) {
  const [copied, setCopied] = useState(false);

  function getJobUrl() {
    return `${window.location.origin}${PATH.JOB_DETAIL(jobId)}`;
  }

  function openShareWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getJobUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">Chia sẻ:</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Chia sẻ qua Facebook"
        onClick={() =>
          openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getJobUrl())}`)
        }
      >
        <FacebookIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Chia sẻ qua X"
        onClick={() =>
          openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getJobUrl())}`)
        }
      >
        <XIcon className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Chia sẻ qua LinkedIn"
        onClick={() =>
          openShareWindow(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getJobUrl())}`,
          )
        }
      >
        <LinkedinIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Sao chép liên kết"
        onClick={handleCopyLink}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </Button>
    </div>
  );
}
