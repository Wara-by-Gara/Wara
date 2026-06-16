"use client";

import * as RAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useMemo, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { createDicebearAvatarDataUri } from "@/lib/dicebear-avatar";
import { getAvatarInitials, resolveAvatarDisplay } from "@/lib/profile-image";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800 text-text-primary",
  {
    variants: {
      size: {
        xs: "size-7 text-[10px]",
        sm: "size-9 text-xs",
        md: "size-[52px] text-sm",
        lg: "size-[60px] text-base",
        xl: "size-[76px] text-lg",
        "2xl": "size-[100px] text-xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const FALLBACK_ICON_SIZE = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
  "2xl": "lg",
} as const;

export interface AvatarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RAvatar.Root>, "asChild">,
    VariantProps<typeof avatarVariants> {
  /** 이미지 URL — 없으면 DiceBear fallback */
  src?: string;
  /** 이미지 alt (접근성용) */
  alt?: string;
  /** DiceBear 시드 — 없으면 name/alt 사용 */
  name?: string;
  /** "+3" 같은 오버플로우 배지 텍스트 */
  initial?: string;
  /** 아이콘 fallback */
  fallbackIcon?: ReactNode;
  /** HOST 표시 — 우측 하단 crown 배지 */
  host?: boolean;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { className, size, src, alt, name, initial, fallbackIcon, host, ...props },
  ref,
) {
  const isOverflowBadge = typeof initial === "string" && initial.startsWith("+");
  const { imageSrc: remoteImageSrc, dicebearSeed } = isOverflowBadge
    ? { imageSrc: undefined, dicebearSeed: undefined }
    : resolveAvatarDisplay(src, name ?? alt);

  const dicebearUri = useMemo(
    () => (dicebearSeed ? createDicebearAvatarDataUri(dicebearSeed) : undefined),
    [dicebearSeed],
  );

  const imageSrc = remoteImageSrc ?? dicebearUri;
  const showDicebearInitials = !remoteImageSrc && Boolean(dicebearUri);
  const { initials, isCompact } = showDicebearInitials
    ? getAvatarInitials(name ?? alt)
    : { initials: "", isCompact: false };

  return (
    <div ref={ref} className="relative inline-flex shrink-0">
      <RAvatar.Root
        className={cn(avatarVariants({ size }), "relative", className)}
        {...props}
      >
        {imageSrc ? (
          <RAvatar.Image
            src={imageSrc}
            alt={alt ?? ""}
            className="size-full object-cover"
          />
        ) : null}
        {initials ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-semibold text-white drop-shadow-sm",
              isCompact && "text-[0.9em] tracking-tight",
            )}
          >
            {initials}
          </span>
        ) : null}
        <RAvatar.Fallback
          delayMs={imageSrc ? 200 : 0}
          className="flex size-full items-center justify-center font-semibold"
        >
          {isOverflowBadge
            ? initial
            : fallbackIcon ?? (
              <Icon
                name="user"
                size={FALLBACK_ICON_SIZE[size ?? "md"]}
                color="currentColor"
                decorative
              />
            )}
        </RAvatar.Fallback>
      </RAvatar.Root>
      {host ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 inline-flex size-[37%] min-w-[18px] items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border"
        >
          <Icon name="crown-yellow" size="xs" className="text-yellow-500" decorative />
        </span>
      ) : null}
    </div>
  );
});

interface AvatarGroupProps {
  max?: number;
  /** overlap: 겹쳐서 표시 (기본). separated: 간격을 두고 떨어뜨려 표시. */
  variant?: "overlap" | "separated";
  /** 좁은 영역에서 가로 스크롤로 전체 목록 탐색 */
  scrollable?: boolean;
  children: ReactNode;
  className?: string;
}

export const AvatarGroup = ({
  children,
  className,
  variant = "overlap",
  scrollable = false,
}: AvatarGroupProps) => {
  const row = (
    <div
      className={cn(
        "flex shrink-0",
        variant === "overlap" ? "-space-x-2.5" : "gap-1.5",
      )}
    >
      {children}
    </div>
  );

  if (!scrollable) {
    return <div className={cn("flex min-w-0", className)}>{row}</div>;
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto overscroll-x-contain scrollbar-hide",
        className,
      )}
    >
      {row}
    </div>
  );
};
