import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LumaBannerVariant } from "./types";
import { LumaButton } from "./Button";

const VARIANT_STYLES: Record<LumaBannerVariant, { bg: string; border: string; text: string; icon: IconName }> = {
  neutral: { bg: "bg-white/8", border: "border-white/12", text: "text-text-primary", icon: "info" },
  success: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "check-circle" },
  warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", icon: "alert-triangle" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "x-circle" },
};

export function LumaBanner({
  variant = "neutral",
  title,
  description,
  cta,
  action,
}: {
  variant?: LumaBannerVariant;
  title?: string;
  description: string;
  cta?: string;
  action?: string;
}) {
  const style = VARIANT_STYLES[variant];
  return (
    <div className={cn("flex items-start gap-3 rounded-sm border p-4", style.bg, style.border)}>
      <Icon name={style.icon} size="sm" color="currentColor" decorative className={cn("mt-0.5 shrink-0", style.text)} />
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className={cn("text-sm font-semibold", style.text)}>{title}</p> : null}
        <p className={cn("text-sm", style.text)}>{description}</p>
        {cta ? (
          <button type="button" className={cn("text-sm font-medium underline-offset-2 hover:underline", style.text)}>
            {cta} →
          </button>
        ) : null}
      </div>
      {action ? (
        <LumaButton color="light" buttonStyle="outline" className="ml-auto shrink-0 text-xs">
          {action}
        </LumaButton>
      ) : null}
    </div>
  );
}
