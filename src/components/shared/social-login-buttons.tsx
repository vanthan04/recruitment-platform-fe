"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { API_PREFIX, PUBLIC_BACKEND_URL } from "@/lib/constants/service";
import type { PublicUserRole } from "@/lib/types/auth";

// Plain <a> full-page navigation on purpose — this leaves the app entirely to
// hit Google/Facebook's consent screen, so it can't go through fetch/Server
// Actions the way every other backend call in this app does.
function socialHref(provider: "google" | "facebook", role: PublicUserRole): string {
  return `${PUBLIC_BACKEND_URL}${API_PREFIX}/auth/${provider}?role=${role}`;
}

interface SocialLoginButtonsProps {
  // When the host form already has its own role selector (register), pass it
  // through so the two pick a consistent role instead of showing a second
  // toggle here.
  role?: PublicUserRole;
}

export function SocialLoginButtons({ role: fixedRole }: SocialLoginButtonsProps) {
  const [role, setRole] = useState<PublicUserRole>(fixedRole ?? "CANDIDATE");
  const effectiveRole = fixedRole ?? role;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">Hoặc</span>
        <Separator className="flex-1" />
      </div>

      {fixedRole === undefined && (
        <div className="flex justify-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => setRole("CANDIDATE")}
            className={
              role === "CANDIDATE"
                ? "text-primary font-medium underline underline-offset-4"
                : "text-muted-foreground"
            }
          >
            Ứng viên
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            type="button"
            onClick={() => setRole("RECRUITER")}
            className={
              role === "RECRUITER"
                ? "text-primary font-medium underline underline-offset-4"
                : "text-muted-foreground"
            }
          >
            Nhà tuyển dụng
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <a href={socialHref("google", effectiveRole)}>
            <GoogleIcon />
            Google
          </a>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <a href={socialHref("facebook", effectiveRole)}>
            <FacebookIcon />
            Facebook
          </a>
        </Button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.27-2.09 3.58-5.17 3.58-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.39-2.29V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
