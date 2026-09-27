"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { rejectGame } from "@/lib/actions/admin";

const PRESETS = ["Doesn't load / broken", "Not built with Three.js", "Blocks iframe embedding", "Low quality / placeholder", "Inappropriate content"];

export function RejectDialog({ gameId, title }: { gameId: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <X /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject “{title}”</DialogTitle>
          <DialogDescription>The submitter will see this reason on their profile.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setReason(p)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">
              {p}
            </button>
          ))}
        </div>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason…" maxLength={500} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await rejectGame(gameId, reason);
                if (!res.ok) return void toast.error(res.error);
                toast.success(res.message);
                setOpen(false);
                router.refresh();
              })
            }
          >
            Reject game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
