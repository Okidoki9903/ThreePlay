"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/lib/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReportDialog({
  gameId,
  reviewId,
  signedIn,
  trigger,
}: {
  gameId: string;
  reviewId?: string;
  signedIn: boolean;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  const reasons = reviewId ? REPORT_REASONS.filter((r) => ["inappropriate", "spam", "other"].includes(r.value)) : REPORT_REASONS;

  function submit() {
    startTransition(async () => {
      const res = await createReport({ gameId, reviewId, reason, details });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setOpen(false);
      setReason("");
      setDetails("");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && !signedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag /> Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reviewId ? "Report review" : "Report game"}</DialogTitle>
          <DialogDescription>Tell the moderators what&apos;s wrong. Reports are private.</DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Reason</legend>
          {reasons.map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition hover:bg-accent/50",
                reason === r.value && "border-primary bg-primary/10",
              )}
            >
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[var(--primary)]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-2">
          <Label htmlFor="report-details">Details (optional)</Label>
          <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything that helps us check faster…" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!reason || pending}>
            {pending ? "Sending…" : "Send report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
