import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface LumaCanvasProps {
  children: ReactNode;
  className?: string;
  theme?: "dark" | "light";
}

/** Luma style guide showcase wrapper */
export function LumaCanvas({ children, className, theme = "light" }: LumaCanvasProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[640px] bg-transparent p-6 text-text-primary",
        theme === "dark" && "theme-dark",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LumaSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="border-b border-border pb-3 text-xl font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function LumaRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label ? <p className="text-sm text-text-secondary">{label}</p> : null}
      {children}
    </div>
  );
}
