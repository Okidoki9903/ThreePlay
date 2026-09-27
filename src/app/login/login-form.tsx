"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitHubIcon, GoogleIcon } from "@/components/ui/brand-icons";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "github">(null);
  const [sent, setSent] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function oauth(provider: "google" | "github") {
    setLoading(provider);
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback(), shouldCreateUser: true },
    });
    setLoading(null);
    if (error) return void toast.error(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
          <Mail className="size-5" />
        </div>
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="text-foreground">{email}</span>.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Button variant="outline" className="w-full" onClick={() => oauth("google")} disabled={loading !== null}>
          <GoogleIcon className="size-4" /> {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => oauth("github")} disabled={loading !== null}>
          <GitHubIcon className="size-4" /> {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={magicLink} className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <Button type="submit" className="w-full" disabled={loading !== null || !email}>
          {loading === "email" ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">No password needed. New here? An account is created automatically.</p>
    </div>
  );
}
