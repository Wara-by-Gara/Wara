"use client";

import { cn } from "@/lib/cn";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { DESIGN_BG_THEMES } from "@/domain/InvitationCreate/constants";

export interface ThemeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (cls: string) => void;
}

export function ThemeSheet({ open, onOpenChange, value, onChange }: ThemeSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent title="배경" description="초대장 배경을 골라보세요">
        <div className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-5 gap-2">
            {DESIGN_BG_THEMES.map(({ id, label, cls }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange(cls)}
                className="flex flex-col items-center gap-1"
                aria-label={label}
              >
                <span
                  className={cn(
                    "aspect-square w-full rounded-md border-2",
                    cls,
                    value === cls ? "border-primary" : "border-border",
                  )}
                />
                <span className={cn("text-[10px]", value === cls ? "font-semibold text-primary" : "text-text-tertiary")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
