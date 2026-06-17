"use client";

import { cn } from "@/lib/cn";
import { BottomSheet } from "@wara/ui";
import { ANIMATIONS } from "@/domain/InvitationCreate/constants";
import type { AnimationId } from "@/domain/InvitationCreate/constants";

export interface EffectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: AnimationId;
  onChange: (id: AnimationId) => void;
}

export function EffectSheet({ open, onOpenChange, value, onChange }: EffectSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="애니메이션 효과" description="고르면 초대장에 바로 적용돼요">
      <div className="grid grid-cols-3 gap-2 pt-1">
          {ANIMATIONS.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border-2 px-2 py-3 transition-colors",
                value === id ? "border-primary bg-primary-soft" : "border-border bg-surface",
              )}
            >
              <span className="text-[24px] leading-none">{emoji}</span>
              <span className={cn("text-[12px]", value === id ? "font-semibold text-primary" : "text-text-secondary")}>
                {label}
              </span>
            </button>
          ))}
      </div>
    </BottomSheet>
  );
}
