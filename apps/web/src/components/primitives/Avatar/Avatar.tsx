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
        lg: "size-14 text-base",
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
  /** 이미지 alt (접근성용) */
  alt?: string;
  /** 이니셜 계산용 실명 — 제공 시 alt 대신 이니셜 계산에 사용 */
  name?: string;
  /** 이니셜 강제 지정 ("+3" 같은 특수 케이스) */
  initial?: string;
  /** 아이콘 fallback */
  fallbackIcon?: ReactNode;
  /** HOST 표시 — 우측 하단 crown 배지 */
  host?: boolean;
}

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const code = trimmed.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return trimmed.slice(1) || trimmed[0]!;
  }
  return trimmed.split(" ")[0]!.slice(0, 2);
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { className, size, src, alt, name, initial, fallbackIcon, host, ...props },
  ref,
) {
  const initialSource = name ?? alt;
  const gradientKey = initialSource ?? initial ?? "anonymous";
  const showGradient = !src && !!(initial ?? initialSource) && !(typeof initial === "string" && initial.startsWith("+"));

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
          {initial
            ? initial
            : initialSource
              ? getInitials(initialSource)
              : fallbackIcon ?? <Icon name="user" size="sm" color="currentColor" decorative />
          }
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
