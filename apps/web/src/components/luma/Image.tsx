import Image from "next/image";
import { cn } from "@/lib/cn";
import type { LumaImageShape } from "./types";

const SHAPE_CLASS: Record<LumaImageShape, string> = {
  circle: "rounded-full aspect-square",
  square: "rounded-lg aspect-square",
  portrait: "rounded-lg aspect-[3/4]",
  landscape: "rounded-lg aspect-[4/3]",
};

export function LumaFixedSizeImage({
  src,
  alt,
  shape = "square",
  size = 80,
  className,
}: {
  src: string;
  alt: string;
  shape?: LumaImageShape;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", SHAPE_CLASS[shape], className)} style={{ width: size, height: shape === "circle" || shape === "square" ? size : undefined }}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={`${size}px`} />
    </div>
  );
}

export function LumaAspectRatioImage({
  src,
  alt,
  ratio = "16/9",
  className,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg", className)} style={{ aspectRatio: ratio }}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 640px" />
    </div>
  );
}
