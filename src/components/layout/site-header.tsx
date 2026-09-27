import { Suspense } from "react";
import Link from "next/link";
import { Dices, Upload } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SearchBox } from "@/components/layout/search-box";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function SiteHeader() {
  const { profile } = await getSession();
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <MobileNav />
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <Link href="/games" className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
            Browse
          </Link>
          <Link href="/leaderboard" className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
            Leaderboard
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Suspense>
            <SearchBox className="hidden w-64 lg:block xl:w-80" />
          </Suspense>
          <Button asChild variant="ghost" size="icon" title="Random game">
            <Link href="/random" prefetch={false} aria-label="Play a random game">
              <Dices className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/submit">
              <Upload /> Submit
            </Link>
          </Button>
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
