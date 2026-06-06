"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  "aria-label": string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

export function ImmersiveTopBarButton({
  "aria-label": ariaLabel,
  onClick,
  children,
  className,
}: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-border/80 bg-white/75 text-text-primary shadow-xs backdrop-blur-md transition-colors duration-150 hover:bg-white",
        className,
      )}
    >
      {children}
    </button>
  );
}
