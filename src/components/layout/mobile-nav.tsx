"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/layout/nav-link";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  links: { href: string; label: string }[];
}

// Slide-in panel driven by SidebarProvider — always mounted so the
// translate-x transition can animate in both directions.
export function MobileNav({ links }: MobileNavProps) {
  const { isOpen, close, triggerRef } = useSidebar();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the panel; return it to the toggle button on close.
    panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();

    function getFocusable(): HTMLElement[] {
      return Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? []);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen, close, triggerRef]);

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
        id="mobile-nav"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!isOpen}
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
          <NavLink
            key={link.href}
            href={link.href}
            onClick={close}
            className="hover:bg-muted hover:text-primary rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            activeClassName="bg-muted text-primary"
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
