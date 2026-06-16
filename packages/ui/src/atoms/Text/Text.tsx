import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import type { TextVariant } from "@wara/tokens";
import { cn } from "../../lib/cn.ts";

export type TextColor =
  | "default"
  | "muted"
  | "disabled"
  | "inverse"
  | "accent"
  | "danger"
  | "success";

const COLOR_CLASS: Record<TextColor, string> = {
  default: "text-text",
  muted: "text-text-muted",
  disabled: "text-text-disabled",
  inverse: "text-text-inverse",
  accent: "text-accent",
  danger: "text-danger",
  success: "text-success",
};

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/** variant별 기본 시맨틱 태그 (as로 덮어쓸 수 있음) */
const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display: "h1",
  title: "h1",
  sectionTitle: "h2",
  cardTitle: "h3",
  bodyLarge: "p",
  body: "p",
  bodySmall: "p",
  caption: "span",
  button: "span",
  badge: "span",
};

type TextOwnProps = {
  variant?: TextVariant;
  color?: TextColor;
  align?: keyof typeof ALIGN_CLASS;
  /** 한 줄 말줄임 */
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
};

export type TextProps<T extends ElementType = "p"> = TextOwnProps & {
  /** 렌더링할 엘리먼트 (기본: variant별 시맨틱 태그) */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof TextOwnProps | "as">;

export function Text<T extends ElementType = "p">({
  as,
  variant = "body",
  color = "default",
  align,
  truncate = false,
  className,
  ...rest
}: TextProps<T>) {
  const Comp = (as ?? DEFAULT_TAG[variant]) as ElementType;
  return (
    <Comp
      className={cn(
        `type-${variant}`,
        COLOR_CLASS[color],
        align && ALIGN_CLASS[align],
        truncate && "truncate",
        className,
      )}
      {...rest}
    />
  );
}
