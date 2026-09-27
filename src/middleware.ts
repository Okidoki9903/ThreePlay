import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, images, hosted game builds and the play-count beacon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|seed/|play/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
