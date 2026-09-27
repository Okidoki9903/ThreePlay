import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { SITE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <LogoMark className="size-6" /> {SITE.name}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.tagline} A home for the best free games built with Three.js.</p>
        </div>
        <FooterCol
          title="Discover"
          links={[
            ["/games", "All games"],
            ["/games?sort=new", "New releases"],
            ["/games?sort=top", "Top rated"],
            ["/leaderboard", "Leaderboard"],
          ]}
        />
        <FooterCol
          title="Developers"
          links={[
            ["/submit", "Submit a game"],
            ["https://threejs.org/docs/", "Three.js docs"],
            ["https://discourse.threejs.org/", "Three.js forum"],
          ]}
        />
        <FooterCol title="Project" links={[[SITE.github, "Source code"]]} />
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        Games are the property of their respective creators. Not affiliated with the three.js project.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {label}
              </a>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
