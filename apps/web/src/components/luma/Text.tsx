import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { LumaPillStyle, LumaSemanticColor } from "./types";

const PILL_COLORS: Record<LumaSemanticColor, { solid: string; outline: string; ghost: string }> = {
  primary: { solid: "bg-white/16 text-white", outline: "border-white/30 text-white", ghost: "text-white/80" },
  secondary: { solid: "bg-gray-700 text-gray-200", outline: "border-gray-600 text-gray-300", ghost: "text-gray-400" },
  light: { solid: "bg-white/8 text-white/80", outline: "border-white/20 text-white/70", ghost: "text-white/60" },
  brand: { solid: "bg-brand-soft text-brand", outline: "border-brand text-brand", ghost: "text-brand" },
  success: { solid: "bg-green-500/20 text-green-400", outline: "border-green-500 text-green-400", ghost: "text-green-400" },
  error: { solid: "bg-red-500/20 text-red-400", outline: "border-red-500 text-red-400", ghost: "text-red-400" },
  warning: { solid: "bg-yellow-500/20 text-yellow-400", outline: "border-yellow-500 text-yellow-400", ghost: "text-yellow-400" },
  barney: { solid: "bg-barney-20 text-barney-50", outline: "border-barney-50 text-barney-40", ghost: "text-barney-40" },
  blue: { solid: "bg-blue-500/20 text-blue-400", outline: "border-blue-500 text-blue-400", ghost: "text-blue-400" },
  gray: { solid: "bg-gray-700 text-gray-300", outline: "border-gray-600 text-gray-400", ghost: "text-gray-400" },
  green: { solid: "bg-green-600/20 text-green-400", outline: "border-green-600 text-green-400", ghost: "text-green-400" },
  orange: { solid: "bg-orange-500/20 text-orange-400", outline: "border-orange-500 text-orange-400", ghost: "text-orange-400" },
  purple: { solid: "bg-barney-30/30 text-barney-40", outline: "border-barney-50 text-barney-40", ghost: "text-barney-40" },
  red: { solid: "bg-red-600/20 text-red-400", outline: "border-red-500 text-red-400", ghost: "text-red-400" },
  yellow: { solid: "bg-yellow-500/20 text-yellow-400", outline: "border-yellow-500 text-yellow-400", ghost: "text-yellow-400" },
};

const pillVariants = cva("inline-flex items-center gap-1 rounded-full font-medium", {
  variants: {
    size: {
      tiny: "px-1.5 py-0.5 text-[11px]",
      small: "px-2 py-0.5 text-xs",
      medium: "px-3 py-1 text-sm",
    },
    style: {
      solid: "border border-transparent",
      outline: "border bg-transparent",
      ghost: "border-transparent bg-transparent",
    },
  },
  defaultVariants: { size: "small", style: "solid" },
});

export interface LumaPillProps extends VariantProps<typeof pillVariants> {
  color?: LumaSemanticColor;
  icon?: boolean;
  dismissible?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LumaPill({ color = "brand", style = "solid", size, icon, dismissible, children, className }: LumaPillProps) {
  const palette = PILL_COLORS[color];
  const colorClass = style === "outline" ? palette.outline : style === "ghost" ? palette.ghost : palette.solid;
  return (
    <span className={cn(pillVariants({ size, style }), colorClass, className)}>
      {icon ? <Icon name="sparkle" size="xs" color="currentColor" decorative /> : null}
      {children}
      {dismissible ? <Icon name="x" size="xs" color="currentColor" decorative /> : null}
    </span>
  );
}

export function LumaShimmer({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("animate-pulse rounded bg-gray-700/40", i === 0 ? "h-4 w-full" : "h-4 w-3/4")}
        />
      ))}
    </div>
  );
}

export function LumaSectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      {subtitle ? <p className="text-base text-text-secondary">{subtitle}</p> : null}
    </div>
  );
}

export function LumaLinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <p className="text-sm text-text-secondary">
      {parts.map((part, i) =>
        part.startsWith("http") ? (
          <a key={i} href={part} className="text-brand underline-offset-2 hover:underline">{part}</a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function LumaLineClamp({ text, lines = 2 }: { text: string; lines?: number }) {
  return (
    <p className="text-sm text-text-primary" style={{ display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {text}
    </p>
  );
}

export const LUMA_PILL_STYLES: LumaPillStyle[] = ["solid", "outline", "ghost"];
