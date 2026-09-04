"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  links: { href: string; label: string }[];
}

// Slide-in panel driven by SidebarProvider — always mounted so the
// translate-x transition can animate in both directions.
export function MobileNav({ links }: MobileNavProps) {
  const { isOpen, close } = useSidebar();

  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", !isOpen && "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
        aria-hidden
      />
      <div
        className={cn(
          "bg-background absolute inset-y-0 right-0 flex w-72 max-w-[80vw] flex-col gap-1 p-4 shadow-xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Đóng menu">
            <X className="size-5" />
          </Button>
        </div>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={close}
            className="hover:bg-muted hover:text-primary rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
