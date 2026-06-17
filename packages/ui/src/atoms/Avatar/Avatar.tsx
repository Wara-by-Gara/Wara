"use client";

import * as RAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { pickAvatarGradient } from "@wara/tokens";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName, type IconSize } from "../../icons/index.ts";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
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

const FALLBACK_ICON_SIZE: Record<NonNullable<AvatarProps["size"]>, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
  "2xl": "lg",
};

/**
 * name에서 아바타 이니셜 추출 — 디폴트: 성을 빼고 이름 두 글자.
 *  - "김와라" → "와라", "정다은" → "다은", "박민" → "민"
 *  - "Lee Soo Yeon" → "Soo" 토큰 앞 2글자 (첫 토큰=성 제외)
 *  - "+5" 같은 오버플로우 배지는 그대로 표시
 */
function initialsOf(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    // 공백 구분(영문 등): 첫 토큰을 성으로 보고 제외, 나머지 앞 2글자
    return parts.slice(1).join("").slice(0, 2);
  }
  // 공백 없음(한글 등): 성 1글자 제외, 이름 2글자
  return trimmed.slice(1, 3) || trimmed.slice(0, 1);
}

export interface AvatarProps
  extends Omit<ComponentPropsWithoutRef<typeof RAvatar.Root>, "asChild">,
    VariantProps<typeof avatarVariants> {
  /** 이미지 URL */
  src?: string;
  /** 이미지 alt (접근성용) */
  alt?: string;
  /** 이미지 없을 때 이니셜 fallback에 사용 */
  name?: string;
  /** 이니셜도 없을 때 표시할 아이콘 (기본: user) */
  fallbackIcon?: IconName;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { className, size, src, alt, name, fallbackIcon = "user", ...props },
  ref,
) {
  const initials = initialsOf(name);
  // Partiful식: 이니셜이 있으면 사용자별 비비드 그라데이션 + 모노그램
  const grad = initials ? pickAvatarGradient(name ?? alt ?? initials) : null;

  // 실제 로드 가능한 URL만 이미지로 사용한다. `dicebear:seed` 등 스킴이 아닌
  // 문자열을 <img src>로 넘기면 로드 실패 → fallback 깜빡임/깨진 아바타가 된다.
  const imageSrc =
    src && /^(https?:|data:|blob:)/i.test(src) ? src : undefined;

  return (
    <RAvatar.Root
      ref={ref}
      className={cn(
        avatarVariants({ size }),
        !grad && "bg-surface-muted text-text-muted",
        className,
      )}
      style={grad ? { background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, color: grad.fg } : undefined}
      {...props}
    >
      {imageSrc ? (
        <RAvatar.Image
          src={imageSrc}
          alt={alt ?? name ?? ""}
          className="size-full object-cover"
        />
      ) : null}
      <RAvatar.Fallback
        delayMs={imageSrc ? 200 : 0}
        className="flex size-full items-center justify-center"
      >
        {initials || (
          <Icon
            name={fallbackIcon}
            size={FALLBACK_ICON_SIZE[size ?? "md"]}
            color="currentColor"
            decorative
          />
        )}
      </RAvatar.Fallback>
    </RAvatar.Root>
  );
});

export interface AvatarGroupProps {
  /** 겹쳐서(overlap, 기본) 또는 간격을 두고(separated) */
  variant?: "overlap" | "separated";
  /** 좁은 영역에서 가로 스크롤 */
  scrollable?: boolean;
  children: ReactNode;
  className?: string;
}

export function AvatarGroup({
  children,
  className,
  variant = "overlap",
  scrollable = false,
}: AvatarGroupProps) {
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
    <div className={cn("w-full overflow-x-auto overscroll-x-contain", className)}>
      {row}
    </div>
  );
}
