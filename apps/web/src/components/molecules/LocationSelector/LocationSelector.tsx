"use client";

import { forwardRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { Switch } from "@/components/primitives/Switch";
import { cn } from "@/lib/cn";

export interface SelectedPlace {
  name: string;
  address: string;
}

export interface LocationSelectorProps {
  label?: string;
  /** 모드 — search/manual/selected/unknown 자동 전환 */
  mode?: "search" | "selected" | "manual" | "unknown";
  /** 검색어 */
  query?: string;
  onQueryChange?: (q: string) => void;
  /** 선택된 장소 */
  selected?: SelectedPlace;
  /** 직접 입력된 주소 */
  manualAddress?: string;
  onManualAddressChange?: (v: string) => void;
  /** 직접 입력 placeholder (예: 온라인 링크 URL) */
  manualPlaceholder?: string;
  /** 미정 토글 */
  unknown?: boolean;
  onUnknownChange?: (v: boolean) => void;
  /** 로딩/no-result/error/permission required */
  state?: "default" | "loading" | "no-result" | "error" | "permission-required";
  onModeChange?: (mode: "search" | "manual") => void;
  error?: string;
  className?: string;
  /** 토글 표시 여부 */
  hideToggle?: boolean;
}

export const LocationSelector = forwardRef<HTMLDivElement, LocationSelectorProps>(
  function LocationSelector(
    {
      label = "장소",
      mode: modeProp,
      query,
      onQueryChange,
      selected,
      manualAddress,
      onManualAddressChange,
      manualPlaceholder = "장소 이름 또는 주소",
      unknown,
      onUnknownChange,
      state = "default",
      onModeChange,
      error,
      className,
      hideToggle = false,
    },
    ref,
  ) {
    const [internalMode, setInternalMode] = useState<NonNullable<LocationSelectorProps["mode"]>>(
      modeProp ?? (selected ? "selected" : "search"),
    );
    const [internalUnknown, setInternalUnknown] = useState(false);

    const effectiveUnknown = unknown !== undefined ? unknown : internalUnknown;
    const mode = modeProp ?? (effectiveUnknown ? "unknown" : internalMode);

    const clearUnknown = () => {
      if (unknown !== undefined) {
        if (unknown) onUnknownChange?.(false);
      } else if (internalUnknown) {
        setInternalUnknown(false);
      }
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)}>
        {/* <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-text-primary">{label}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                clearUnknown();
                setInternalMode("search");
                onModeChange?.("search");
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[12px]",
                mode === "search" ? "bg-primary-soft text-primary" : "text-text-tertiary",
              )}
            >
              검색
            </button>
          </div>
        </div> */}

        {mode === "search" && (
          <>
            <TextInput
              leftIcon="search"
              placeholder="장소 검색"
              value={query ?? ""}
              onChange={(e) => onQueryChange?.(e.target.value)}
            />
            {state === "loading" && (
              <p className="text-[13px] text-text-tertiary">검색 중…</p>
            )}
            {state === "no-result" && (
              <p className="text-[13px] text-text-tertiary">검색 결과가 없어요</p>
            )}
            {state === "error" && (
              <p className="text-[13px] text-danger">
                장소 검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.
              </p>
            )}
            {state === "permission-required" && (
              <div className="flex items-center justify-between gap-3 rounded-md bg-background-soft p-3">
                <p className="text-[14px] text-text-primary">위치 권한이 필요해요</p>
                <Button size="sm" variant="text" className="shrink-0">
                  권한 허용
                </Button>
              </div>
            )}
          </>
        )}

        {mode === "selected" && selected && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-surface p-3">
            <Icon name="map-pin" size="md" color="primary" decorative className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-text-primary">{selected.name}</p>
              <p className="text-[13px] text-text-secondary">{selected.address}</p>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <TextInput
            leftIcon="map-pin"
            placeholder={manualPlaceholder}
            value={manualAddress ?? ""}
            onChange={(e) => onManualAddressChange?.(e.target.value)}
          />
        )}

        {!hideToggle && (
          <label className="flex items-center justify-between gap-3 rounded-md bg-background-soft px-4 py-2.5">
            <span className="text-[14px] text-text-secondary">아직 정해지지 않았어요</span>
            <Switch
              checked={effectiveUnknown}
              onCheckedChange={(v) => {
                if (unknown === undefined) setInternalUnknown(v);
                onUnknownChange?.(v);
              }}
            />
          </label>
        )}

        {error ? <span className="text-[13px] text-danger">{error}</span> : null}
      </div>
    );
  },
);
