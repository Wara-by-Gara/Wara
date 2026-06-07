"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LumaSemanticColor } from "./types";

const COLOR_MAP: Record<LumaSemanticColor, { solid: string; outline: string; ghost: string }> = {
  primary: { solid: "bg-primary text-text-inverse hover:bg-primary-hover", outline: "border-primary text-text-primary hover:bg-gray-50", ghost: "text-text-primary hover:bg-gray-50" },
  secondary: { solid: "bg-gray-600 text-white hover:bg-gray-500", outline: "border-gray-600 text-gray-600 hover:bg-gray-50", ghost: "text-gray-600 hover:bg-gray-50" },
  light: { solid: "bg-gray-100 text-text-primary hover:bg-gray-200", outline: "border-border-strong text-text-secondary hover:bg-gray-50", ghost: "text-text-secondary hover:bg-gray-50" },
  brand: { solid: "bg-brand text-white hover:bg-brand-hover", outline: "border-brand text-brand hover:bg-brand-soft", ghost: "text-brand hover:bg-brand-soft" },
  success: { solid: "bg-green-500 text-white hover:bg-green-600", outline: "border-green-500 text-green-400 hover:bg-green-500/10", ghost: "text-green-400 hover:bg-green-500/10" },
  error: { solid: "bg-red-500 text-white hover:bg-red-600", outline: "border-red-500 text-red-400 hover:bg-red-500/10", ghost: "text-red-400 hover:bg-red-500/10" },
  warning: { solid: "bg-yellow-500 text-gray-900 hover:bg-yellow-400", outline: "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10", ghost: "text-yellow-400 hover:bg-yellow-500/10" },
  barney: { solid: "bg-barney-50 text-white hover:bg-barney-60", outline: "border-barney-50 text-barney-40 hover:bg-barney-10", ghost: "text-barney-40 hover:bg-barney-10" },
  blue: { solid: "bg-blue-500 text-white hover:bg-blue-600", outline: "border-blue-500 text-blue-400 hover:bg-blue-500/10", ghost: "text-blue-400 hover:bg-blue-500/10" },
  gray: { solid: "bg-gray-700 text-white hover:bg-gray-600", outline: "border-gray-600 text-gray-400 hover:bg-white/8", ghost: "text-gray-400 hover:bg-white/8" },
  green: { solid: "bg-green-600 text-white hover:bg-green-500", outline: "border-green-600 text-green-400 hover:bg-green-500/10", ghost: "text-green-400 hover:bg-green-500/10" },
  orange: { solid: "bg-orange-500 text-white hover:bg-orange-600", outline: "border-orange-500 text-orange-400 hover:bg-orange-500/10", ghost: "text-orange-400 hover:bg-orange-500/10" },
  purple: { solid: "bg-barney-60 text-white hover:bg-barney-70", outline: "border-barney-50 text-barney-40 hover:bg-barney-10", ghost: "text-barney-40 hover:bg-barney-10" },
  red: { solid: "bg-red-600 text-white hover:bg-red-500", outline: "border-red-500 text-red-400 hover:bg-red-500/10", ghost: "text-red-400 hover:bg-red-500/10" },
  yellow: { solid: "bg-yellow-400 text-gray-900 hover:bg-yellow-300", outline: "border-yellow-400 text-yellow-300 hover:bg-yellow-500/10", ghost: "text-yellow-300 hover:bg-yellow-500/10" },
};

const buttonBase = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      buttonStyle: {
        solid: "border border-transparent px-3.5 py-2.5 rounded-xs",
        outline: "border bg-transparent px-3.5 py-2.5 rounded-full",
        ghost: "border-transparent bg-transparent px-3.5 py-2.5 rounded-xs",
        icon: "size-[38px] rounded-xs p-2.5",
        iconRound: "size-[38px] rounded-full p-2.5",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    defaultVariants: { buttonStyle: "solid", fullWidth: false },
  },
);

export interface LumaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonBase> {
  color?: LumaSemanticColor;
  icon?: IconName;
  loading?: boolean;
}

export const LumaButton = forwardRef<HTMLButtonElement, LumaButtonProps>(function LumaButton(
  { className, color = "primary", buttonStyle = "solid", fullWidth, icon, loading, children, disabled, ...props },
  ref,
) {
  const palette = COLOR_MAP[color];
  const colorClass =
    buttonStyle === "outline" ? palette.outline : buttonStyle === "ghost" ? palette.ghost : palette.solid;

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonBase({ buttonStyle, fullWidth }), colorClass, className)}
      {...props}
    >
      {loading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : icon ? (
        <Icon name={icon} size="sm" color="currentColor" decorative />
      ) : null}
      {children}
    </button>
  );
});

export const LUMA_BUTTON_COLORS: LumaSemanticColor[] = [
  "primary", "secondary", "light", "brand", "success", "error", "warning",
  "barney", "blue", "gray", "green", "orange", "purple", "red", "yellow",
];

export const LUMA_BUTTON_COLOR_LABELS: Record<LumaSemanticColor, string> = {
  primary: "기본",
  secondary: "보조",
  light: "연한",
  brand: "브랜드",
  success: "성공",
  error: "오류",
  warning: "경고",
  barney: "바니",
  blue: "파랑",
  gray: "회색",
  green: "초록",
  orange: "주황",
  purple: "보라",
  red: "빨강",
  yellow: "노랑",
};
