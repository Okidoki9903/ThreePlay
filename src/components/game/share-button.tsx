"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHotkey } from "@/hooks/use-hotkey";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const text = `Play ${title} — free in your browser`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* dismissed */
      }
    } else copy();
  }

  useHotkey("s", nativeShare);

  const enc = encodeURIComponent;
  const targets = [
    ["X / Twitter", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
    ["Reddit", `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`],
    ["Bluesky", `https://bsky.app/intent/compose?text=${enc(`${text} ${url}`)}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" title="Share (S)">
          <Share2 /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={copy}>
          <Link2 /> Copy link
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onSelect={nativeShare}>
            <Share2 /> Share via…
          </DropdownMenuItem>
        )}
        {targets.map(([name, href]) => (
          <DropdownMenuItem key={name} asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
