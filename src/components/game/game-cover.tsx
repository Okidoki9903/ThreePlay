import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/** next/image wrapper that serves local SVG covers unoptimised. */
export function GameCover({ src, alt, className, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  const unoptimized = src.endsWith(".svg") || src.startsWith("data:");
  return <Image src={src} alt={alt} unoptimized={unoptimized} className={cn("object-cover", className)} {...props} />;
}
