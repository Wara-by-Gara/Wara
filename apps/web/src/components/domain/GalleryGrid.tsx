"use client";

import Image from "next/image";
import { Icon } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface GalleryPhoto {
  id: string;
  url: string;
  alt?: string;
}

export interface GalleryGridProps {
  photos: GalleryPhoto[];
  columns?: 2 | 3 | 4;
  onSelect?: (index: number) => void;
  /** 이 개수까지만 보여주고 마지막 칸에 +N 오버레이 */
  maxVisible?: number;
  className?: string;
}

const COLS: Record<NonNullable<GalleryGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function GalleryGrid({
  photos,
  columns = 3,
  onSelect,
  maxVisible,
  className,
}: GalleryGridProps) {
  const visible = maxVisible ? photos.slice(0, maxVisible) : photos;
  const overflow = maxVisible ? photos.length - maxVisible : 0;

  return (
    <div className={cn("grid gap-1.5", COLS[columns], className)}>
      {visible.map((photo, i) => {
        const isLast = i === visible.length - 1;
        const showOverflow = isLast && overflow > 0;
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onSelect?.(i)}
            aria-label={photo.alt ?? `사진 ${i + 1}`}
            className="group relative aspect-square overflow-hidden rounded-sm bg-surface-muted focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
          >
            <Image
              src={photo.url}
              alt={photo.alt ?? ""}
              fill
              unoptimized
              sizes="33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
            {showOverflow ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 type-cardTitle font-bold text-white">
                +{overflow}
              </span>
            ) : null}
          </button>
        );
      })}
      {photos.length === 0 ? (
        <div className="col-span-full flex flex-col items-center gap-2 py-10 text-text-muted">
          <Icon name="images" size="lg" color="currentColor" decorative />
          <span className="type-bodySmall">아직 사진이 없어요</span>
        </div>
      ) : null}
    </div>
  );
}
