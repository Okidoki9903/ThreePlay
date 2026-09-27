import type { Metadata } from "next";
import { BrowseView, type BrowseSearchParams } from "@/components/browse/browse-view";

type Props = { searchParams: Promise<BrowseSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, tag } = await searchParams;
  const title = q ? `Search: ${q}` : tag ? `#${tag} games` : "Browse games";
  return { title, alternates: { canonical: "/games" } };
}

export default async function GamesPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {params.q ? (
            <>
              Results for <span className="text-gradient">“{params.q}”</span>
            </>
          ) : params.tag ? (
            <>
              <span className="text-gradient">#{params.tag}</span> games
            </>
          ) : (
            "Browse games"
          )}
        </h1>
        <p className="mt-2 text-muted-foreground">Every game here is free and runs right in your browser.</p>
      </header>
      <BrowseView searchParams={params} />
    </div>
  );
}
