"use client";

import { cn } from "@/lib/cn";
import {
  RSVPButtonGroup,
  type RSVPButtonGroupProps,
  type RSVPValue,
} from "@/components/molecules/RSVPButtonGroup";

export type RsvpSectionProps = Pick<
  RSVPButtonGroupProps,
  | "value"
  | "onValueChange"
  | "options"
  | "fullCapacity"
  | "closed"
  | "loading"
  | "helperText"
  | "disabled"
> & { isDarkBg?: boolean };

export function RsvpSection({
  value,
  onValueChange,
  options,
  fullCapacity,
  closed,
  loading,
  helperText,
  disabled,
  isDarkBg,
}: RsvpSectionProps) {
  return (
    <section>
      <h3 className={cn("text-[15px] font-bold", isDarkBg ? "text-white" : "text-text-primary")}>참석 여부</h3>
      <p className={cn("mt-0.5 text-[12px]", isDarkBg ? "text-white/70" : "text-text-secondary")}>원하는 응답을 선택해주세요</p>
      <div className="mt-3">
        <RSVPButtonGroup
          layout="horizontal-3"
          shape="pill"
          value={value}
          onValueChange={onValueChange}
          options={options}
          fullCapacity={fullCapacity}
          closed={closed}
          loading={loading}
          helperText={helperText}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

export function toRsvpButtonValue(
  status: "attending" | "undecided" | "absent" | undefined,
): RSVPValue | undefined {
  if (!status) return undefined;
  if (status === "attending") return "attending";
  if (status === "undecided") return "maybe";
  return "declined";
}

export function fromRsvpButtonValue(value: RSVPValue): "attending" | "undecided" | "absent" {
  if (value === "attending") return "attending";
  if (value === "maybe") return "undecided";
  return "absent";
}
