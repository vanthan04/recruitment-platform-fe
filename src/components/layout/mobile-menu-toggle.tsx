"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";

export function MobileMenuToggle() {
  const { isOpen, toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={toggle}
      aria-label="Mở menu"
      aria-expanded={isOpen}
      aria-controls="mobile-nav"
    >
      <Menu className="size-5" />
    </Button>
  );
}
