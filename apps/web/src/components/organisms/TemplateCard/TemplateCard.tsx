"use client";

import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/primitives/Badge";
import { cn } from "@/lib/cn";

export type TemplateCardVariant =
  | "basic"
  | "selected"
  | "premium"
  | "category"
  | "noImage";

export interface TemplateCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: TemplateCardVariant;
  /** 템플릿 썸네일 */
  imageUrl?: string;
  /** 템플릿 이름 */
  name: string;
  /** 카테고리 라벨 (예: Y2K, Minimal) */
  category?: string;
}

export const TemplateCard = forwardRef<HTMLButtonElement, TemplateCardProps>(
  function TemplateCard(
    { className, variant = "basic", imageUrl, name, category, ...props },
    ref,
  ) {
    const isSelected = variant === "selected";
    const isLocked = variant === "premium";

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isSelected}
        className={cn(
          "group flex flex-col gap-2 text-left transition-transform active:scale-95",
          "focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100",
            isSelected ? "ring-4 ring-primary" : "ring-1 ring-border",
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Icon name="palette" size="xl" color="inactive" decorative />
            </div>
          )}
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Icon name="lock" size="lg" color="inverse" decorative />
            </div>
          ) : null}
          {isSelected ? (
            <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-text-inverse">
              <Icon name="check" size="xs" color="currentColor" decorative />
            </span>
          ) : null}
          {category ? (
            <span className="absolute left-2 top-2">
              <Badge variant="private" size="sm">
                {category}
              </Badge>
            </span>
          ) : null}
        </div>
        <p className={cn("text-[14px] font-semibold", isSelected ? "text-primary" : "text-text-primary")}>
          {name}
        </p>
      </button>
    );
  },
);
