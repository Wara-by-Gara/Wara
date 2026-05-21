"use client";

import * as RAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { avatarGradientStyle } from "@/lib/avatar-gradient";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-text-primary",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface AvatarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RAvatar.Root>, "asChild">,
    VariantProps<typeof avatarVariants> {
  /** 이미지 URL — 없으면 fallback */
  src?: string;
  /** 이미지 alt — 없으면 이니셜 자동 생성 */
  alt?: string;
  /** 이니셜 fallback (예: "김와") */
  initial?: string;
  /** 아이콘 fallback (예: 'user') */
  fallbackIcon?: ReactNode;
  /** HOST 표시 — 우측 하단 crown 배지 */
  host?: boolean;
}

const getInitials = (alt?: string): string => {
  if (!alt) return "?";
  const trimmed = alt.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2);
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { className, size, src, alt, initial, fallbackIcon, host, ...props },
  ref,
) {
  const gradientKey = alt ?? initial ?? "anonymous";
  const showGradient = !src && !(typeof initial === "string" && initial.startsWith("+"));

  return (
    <div ref={ref} className="relative inline-flex shrink-0">
      <RAvatar.Root
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {src ? (
          <RAvatar.Image
            src={src}
            alt={alt ?? ""}
            className="size-full object-cover"
          />
        ) : null}
        <RAvatar.Fallback
          delayMs={src ? 200 : 0}
          className="flex size-full items-center justify-center font-semibold"
          style={showGradient ? avatarGradientStyle(gradientKey) : undefined}
        >
          {initial ?? (fallbackIcon ? fallbackIcon : <Icon name="user" size="sm" color="currentColor" decorative />)}
          {!initial && !fallbackIcon && alt ? getInitials(alt) : null}
        </RAvatar.Fallback>
      </RAvatar.Root>
      {host ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 inline-flex size-[38%] min-w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border"
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
        variant === "overlap" ? "-space-x-2" : "gap-1.5",
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
