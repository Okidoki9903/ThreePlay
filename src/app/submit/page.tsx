import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { SubmitForm } from "@/app/submit/submit-form";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Submit a game", robots: { index: false } };

const GUIDELINES = [
  "Built with Three.js (WebGL or WebGPU) and free to play",
  "Runs in a browser without installs or sign-up walls",
  "You made it, or have the right to share it",
  "No malware, crypto-miners, or adult content",
];

export default async function SubmitPage() {
  const { user, profile } = await requireUser("/submit");
  const categories = await getCategories();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Submit a game</h1>
          <p className="mt-2 text-muted-foreground">
            Share your Three.js creation. Submissions are reviewed by a moderator, usually within a couple of days.
          </p>
        </header>
        <SubmitForm userId={user.id} categories={categories} defaultDeveloper={profile.display_name ?? profile.username} />
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Guidelines</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {GUIDELINES.map((g) => (
              <li key={g} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {g}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          <h2 className="mb-2 font-semibold text-foreground">Hosting a zip?</h2>
          Upload a static build (≤ 50&nbsp;MB) with an <code className="rounded bg-muted px-1">index.html</code> at the root or in a single top folder.
          Use relative asset paths. The game runs in a sandbox without cookies or storage from ThreePlay.
        </div>
      </aside>
    </div>
  );
}
