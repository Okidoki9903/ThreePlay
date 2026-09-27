import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { LogoMark } from "@/components/layout/logo";
import { getSession } from "@/lib/auth";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const target = safeNext(next);
  const { user } = await getSession();
  if (user) redirect(target);

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 -z-10 size-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="glass w-full max-w-sm space-y-6 rounded-2xl border p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <LogoMark className="mx-auto size-12" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to ThreePlay</h1>
          <p className="text-sm text-muted-foreground">Sign in to rate games, save favorites and submit your own.</p>
        </div>
        {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <LoginForm next={target} />
      </div>
    </div>
  );
}
