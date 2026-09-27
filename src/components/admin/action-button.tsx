"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";

/** Runs a bound server action, toasts the result and refreshes the page. */
export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: Omit<ButtonProps, "onClick"> & { action: () => Promise<ActionResult>; confirm?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const res = await action();
          if (res.ok) toast.success(res.message ?? "Done");
          else toast.error(res.error);
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}
