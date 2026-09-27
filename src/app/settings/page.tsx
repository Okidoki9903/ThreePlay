import type { Metadata } from "next";
import { ProfileForm } from "@/app/settings/profile-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const { user, profile } = await requireUser("/settings");
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Signed in as {user.email}</p>
      </header>
      <ProfileForm profile={profile} />
    </div>
  );
}
