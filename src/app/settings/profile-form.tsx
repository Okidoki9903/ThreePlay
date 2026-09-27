"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ username, displayName, bio, website });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setErrors({});
      toast.success(res.message);
      router.push(`/u/${res.data!.username}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-6">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center rounded-lg border border-input bg-background/60 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <span className="pl-3 text-sm text-muted-foreground">threeplay/u/</span>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="h-10 flex-1 bg-transparent pr-3 text-sm outline-none" maxLength={24} aria-invalid={Boolean(errors.username)} />
        </div>
        {errors.username && <p className="text-xs text-destructive">{errors.username[0]}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
        <p className="text-xs text-muted-foreground">{bio.length}/280</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" aria-invalid={Boolean(errors.website)} />
        {errors.website && <p className="text-xs text-destructive">{errors.website[0]}</p>}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
