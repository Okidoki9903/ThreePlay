import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  href,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)} aria-labelledby={`sec-${title}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id={`sec-${title}`} className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      {icon && <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
