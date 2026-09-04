import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { PATH } from "@/lib/constants/path";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <svg
        viewBox="0 0 400 800"
        aria-hidden="true"
        className="text-primary pointer-events-none absolute inset-y-0 left-0 hidden h-full w-[420px] lg:block"
      >
        <defs>
          <pattern id="auth-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="currentColor" />
          </pattern>
          <linearGradient id="auth-dots-fade" x1="0" y1="1" x2="1" y2="0.1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="auth-dots-mask">
            <rect x="-100" y="0" width="600" height="800" fill="url(#auth-dots-fade)" />
          </mask>
        </defs>
        <g mask="url(#auth-dots-mask)" transform="rotate(-40 60 420)">
          <polygon points="-80,340 140,340 140,220 320,420 140,620 140,500 -80,500" fill="url(#auth-dots)" />
        </g>
      </svg>

      <div className="relative z-10 flex w-full flex-col items-center gap-6">
        <div className="border-border bg-card w-full max-w-md rounded-3xl border p-8 shadow-xl sm:p-10">
          <Link href={PATH.HOME} className="mb-6 flex items-center justify-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <Briefcase className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Recruitment<span className="text-primary">Platform</span>
            </span>
          </Link>
          {children}
        </div>
        <p className="text-muted-foreground text-center text-xs">
          © {new Date().getFullYear()} Recruitment Platform. Đã đăng ký bản quyền.
        </p>
      </div>
    </div>
  );
}
