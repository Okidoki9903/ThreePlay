"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/layout/search-box";
import { NAV_LINKS } from "@/components/layout/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-4 max-w-sm translate-y-0">
        <DialogTitle>Menu</DialogTitle>
        <SearchBox />
        <nav className="grid gap-1" onClick={() => setOpen(false)}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent">
              <l.icon className="size-4 text-muted-foreground" /> {l.label}
            </Link>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
