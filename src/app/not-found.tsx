import Link from "next/link";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-gradient text-8xl font-bold tracking-tighter">404</p>
      <h1 className="text-xl font-semibold">This level doesn&apos;t exist</h1>
      <p className="text-muted-foreground">The page you&apos;re looking for fell out of the world. Try another one?</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/random" prefetch={false}>
            <Dices /> Random game
          </Link>
        </Button>
      </div>
    </div>
  );
}
