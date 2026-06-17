"use client";

import { cn } from "@/lib/cn";
import { RSVPButtonGroup, type RSVPValue } from "@/components/domain";
import type { RSVPButtonGroupProps } from "@/components/domain/RSVPButtonGroup";

export type RsvpSectionProps = {
  value?: RSVPValue;
  onValueChange?: (value: RSVPValue) => void;
  options?: RSVPButtonGroupProps["options"];
  closed?: boolean;
  loading?: boolean;
  helperText?: string;
  isDarkBg?: boolean;
};

export function RsvpSection({
  value,
  onValueChange,
  options,
  closed,
  loading,
  helperText,
  isDarkBg,
}: RsvpSectionProps) {
  return (
    <section>
      <h3 className={cn("text-[18px] font-bold", isDarkBg ? "text-white" : "text-text")}>참석 여부</h3>
      <p className={cn("mt-0.5 text-[14px]", isDarkBg ? "text-white/70" : "text-text-muted")}>원하는 응답을 선택해주세요</p>
      <div className="mt-3">
        <RSVPButtonGroup
          value={value}
          onValueChange={onValueChange}
          options={options}
          closed={closed}
          loading={loading}
          helperText={helperText}
          isDarkBg={isDarkBg}
        />
      </div>
    </section>
  );
}
