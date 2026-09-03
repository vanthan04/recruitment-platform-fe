"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";

export function MobileMenuToggle() {
  const { toggle } = useSidebar();

  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={toggle} aria-label="Mở menu">
      <Menu className="size-5" />
    </Button>
  );
}
