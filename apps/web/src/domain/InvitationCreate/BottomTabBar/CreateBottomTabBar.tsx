"use client";

import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Button } from "@/components/primitives/Button";

export interface CreateBottomTabBarProps {
  onBackground: () => void;
  onEffect: () => void;
  onSettings: () => void;
  onPreview: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
}

const TABS: { key: string; icon: IconName; label: string }[] = [
  { key: "background", icon: "palette", label: "배경" },
  { key: "effect", icon: "sparkles", label: "효과" },
  { key: "settings", icon: "settings", label: "설정" },
  { key: "preview", icon: "eye", label: "미리보기" },
];

export function CreateBottomTabBar({
  onBackground,
  onEffect,
  onSettings,
  onPreview,
  onSubmit,
  submitLabel,
  submitting,
}: CreateBottomTabBarProps) {
  const handlers: Record<string, () => void> = {
    background: onBackground,
    effect: onEffect,
    settings: onSettings,
    preview: onPreview,
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface/95 px-page pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={handlers[key]}
            className="flex flex-col items-center gap-1 rounded-sm py-1.5 text-text-secondary hover:text-text-primary"
          >
            <Icon name={icon} size="md" color="currentColor" decorative />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
      <div className="pt-2">
        <Button variant="primary" size="lg" fullWidth onClick={onSubmit} disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
