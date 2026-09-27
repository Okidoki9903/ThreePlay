"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/hooks/use-hotkey";

const SHORTCUTS: [string, string][] = [
  ["Enter / P", "Start the game"],
  ["F", "Toggle fullscreen"],
  ["R", "Reload the game"],
  ["L", "Add / remove favorite"],
  ["S", "Share"],
  ["N", "Random next game"],
  ["/", "Search"],
  ["?", "Show this help"],
];

export function ShortcutsDialog({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useHotkey("?", () => setOpen(true));
  useHotkey("n", () => router.push(`/random?exclude=${gameId}`));

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
        <Keyboard />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Click outside the game first — games capture keys while focused.</DialogDescription>
          </DialogHeader>
          <dl className="divide-y">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} className="flex items-center justify-between py-2 text-sm">
                <dt className="text-muted-foreground">{d}</dt>
                <dd>
                  <kbd className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">{k}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
