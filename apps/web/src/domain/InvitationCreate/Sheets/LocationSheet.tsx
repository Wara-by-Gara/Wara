"use client";

import { Button } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import type { Place } from "@/lib/api/locations";

export interface LocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "search" | "selected";
  query: string;
  results: Place[];
  searchState: "default" | "loading" | "no-result" | "error";
  unknown: boolean;
  error?: boolean;
  selectedName?: string;
  selectedAddress?: string;
  onQueryChange: (q: string) => void;
  onSelectPlace: (place: Place) => void;
  onUnknownChange: (v: boolean) => void;
}

export function LocationSheet({
  open,
  onOpenChange,
  mode,
  query,
  results,
  searchState,
  unknown,
  error,
  selectedName,
  selectedAddress,
  onQueryChange,
  onSelectPlace,
  onUnknownChange,
}: LocationSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="모임 장소">
        <div className="flex flex-col gap-3 pt-1">
          <LocationSelector
            mode={unknown ? "unknown" : mode}
            query={query}
            onQueryChange={onQueryChange}
            selected={mode === "selected" && selectedName ? { name: selectedName, address: selectedAddress ?? "" } : undefined}
            state={searchState}
            unknown={unknown}
            onUnknownChange={onUnknownChange}
            error={error ? "장소를 선택해주세요" : undefined}
          />
          {mode === "search" && results.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface">
              {results.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  className="flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                  onClick={() => onSelectPlace(place)}
                >
                  <span className="text-[14px] font-semibold text-text">{place.placeName}</span>
                  <span className="text-[12px] text-text-disabled">{place.roadAddress || place.address}</span>
                </button>
              ))}
            </div>
          )}
          <Button variant="primary" size="lg" fullWidth onClick={() => onOpenChange(false)}>
            완료
          </Button>
        </div>
      </BottomSheet>
  );
}
