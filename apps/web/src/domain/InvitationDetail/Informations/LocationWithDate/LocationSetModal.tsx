"use client";

import { useEffect, useState } from "react";
import { Modal } from "@wara/ui";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import { useLocationSearch, useSetEventLocation } from "@/hooks/useLocation";
import type { Place } from "@/lib/api/locations";

interface LocationSetModalProps {
  invitationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 호스트가 초대장 상세에서 모임 장소를 검색·선택해 바로 저장하는 모달 */
export function LocationSetModal({ invitationId, open, onOpenChange }: LocationSetModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 키 입력마다 검색하지 않도록 300ms 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const search = useLocationSearch(debouncedQuery);
  const setLocation = useSetEventLocation(invitationId);

  const results: Place[] = search.data?.pages.flatMap((p) => p.places) ?? [];
  const hasQuery = debouncedQuery.trim().length >= 2;
  const searchState: "default" | "loading" | "no-result" | "error" = search.isError
    ? "error"
    : hasQuery && search.isFetching && results.length === 0
      ? "loading"
      : hasQuery && !search.isFetching && results.length === 0
        ? "no-result"
        : "default";

  const handleSelect = (place: Place) => {
    setLocation.mutate(
      {
        placeId: place.placeId,
        placeName: place.placeName,
        address: place.roadAddress || place.address,
        lat: place.lat,
        lng: place.lng,
      },
      {
        onSuccess: () => {
          setQuery("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="모임 장소 설정">
      <div className="flex flex-col gap-3">
        <LocationSelector
          mode="search"
          hideToggle
          query={query}
          onQueryChange={setQuery}
          state={searchState}
        />
        {results.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface">
            {results.map((place) => (
              <button
                key={place.placeId}
                type="button"
                disabled={setLocation.isPending}
                onClick={() => handleSelect(place)}
                className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
              >
                <span className="text-[14px] font-semibold text-text">{place.placeName}</span>
                <span className="text-[12px] text-text-disabled">{place.roadAddress || place.address}</span>
              </button>
            ))}
          </div>
        )}
        {setLocation.isError && (
          <p className="text-[13px] text-danger">장소 저장에 실패했어요. 다시 시도해주세요.</p>
        )}
      </div>
    </Modal>
  );
}
