"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { LocationCard } from "@/components/organisms/LocationCard";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type MapPageState =
  | "previewInInvitation"
  | "fullscreen"
  | "loading"
  | "error"
  | "noLocation"
  | "searchInitial"
  | "searchTyping"
  | "searchResults"
  | "searchEmpty"
  | "selectedPlace"
  | "manualAddress"
  | "currentLocationPermission"
  | "permissionDenied"
  | "permissionSettingsGuide"
  | "directionBottomSheet"
  | "openKakaoMap"
  | "openNaverMap"
  | "openGoogleMap"
  | "noMapAppGuide"
  | "onlineMeetingLink";

export interface SearchResult {
  placeId: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MapPageProps {
  state?: MapPageState;
  onBack?: () => void;

  /** 행사 장소 (있을 때만 전달) */
  eventLocation?: { placeName: string; address: string; lat?: number; lng?: number } | null;
  onGetDirections?: () => void;
  onRetry?: () => void;

  /** 온라인 모임 링크 */
  onlineLink?: string;

  /** 실제 지도 컴포넌트 슬롯 (없으면 placeholder 이미지) */
  mapSlot?: React.ReactNode;

  /** 도착 여부 (도착 배너 표시) */
  isArrived?: boolean;

  /** 장소 검색 */
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  searchResults?: SearchResult[];
  onSelectPlace?: (place: SearchResult) => void;
  /** 검색 결과 무한스크롤 */
  onLoadMoreSearch?: () => void;
  isLoadingMoreSearch?: boolean;
  /** Kakao 45개 상한에 막혀 일부만 노출됨 → 구체화 안내 */
  searchCapReached?: boolean;

  /** 길찾기 */
  onOpenKakaoMap?: () => void;
  onOpenNaverMap?: () => void;
  onOpenGoogleMap?: () => void;
  onCloseDirections?: () => void;

  /** 위치 권한 */
  onRequestPermission?: () => void;
  onOpenSettings?: () => void;

  /** HOST 여부 — noLocation 상태에서 장소 설정 버튼 표시 */
  isHost?: boolean;
  onSetLocation?: () => void;

  /** 내 위치 버튼 */
  onLocate?: () => void;

  /** selectedPlace 상태에서 "이 장소로 설정하기" 버튼 표시 — 호스트가 검색 후 확정할 때 사용 */
  onConfirmSelectedPlace?: () => void;
  isSavingPlace?: boolean;

  /** E2E·접근성: 위치 추적 윈도우 활성 여부 */
  trackingActive?: boolean;
}

function MapPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[url('https://placehold.co/640x900/EEF8FF/8DD4FF?text=Map')] bg-cover bg-center" />
  );
}

export const MapPage = ({
  state = "fullscreen",
  onBack,
  eventLocation,
  onGetDirections,
  onRetry,
  onlineLink,
  mapSlot,
  isArrived,
  searchQuery = "",
  onSearchQueryChange,
  searchResults,
  onSelectPlace,
  onLoadMoreSearch,
  isLoadingMoreSearch,
  searchCapReached,
  onOpenKakaoMap,
  onOpenNaverMap,
  onOpenGoogleMap,
  onCloseDirections,
  onRequestPermission,
  onOpenSettings,
  isHost,
  onSetLocation,
  onLocate,
  onConfirmSelectedPlace,
  isSavingPlace,
  trackingActive,
}: MapPageProps) => {
  const placeName = eventLocation?.placeName ?? '';
  const address = eventLocation?.address ?? '';

  // ── previewInInvitation ──────────────────────────────────────────────
  if (state === "previewInInvitation") {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-5">
          <LocationCard
            variant="preview"
            placeName={placeName}
            address={address}
            mapLat={35.8242}
            mapLng={127.148}
            onGetDirections={onGetDirections}
          />
        </main>
      </div>
    );
  }

  // ── loading ──────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-background">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        </main>
      </div>
    );
  }

  // ── error ────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className={mobileMainCenter}>
          <ErrorState title="지도를 불러오지 못했어요" onRetry={onRetry ?? (() => {})} />
        </main>
      </div>
    );
  }

  // ── noLocation / onlineMeetingLink ───────────────────────────────────
  if (state === "noLocation" || state === "onlineMeetingLink") {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <div className="px-page py-4">
          {state === "noLocation" ? (
            <>
              <LocationCard variant="unknown" />
              {isHost && (
                <button
                  type="button"
                  onClick={onSetLocation}
                  className="mt-2 block w-full text-center text-[13px] text-primary"
                >
                  장소 설정하기 →
                </button>
              )}
            </>
          ) : (
            <LocationCard
              variant="online"
              onlineLink={onlineLink ?? "https://meet.example.com/wara"}
            />
          )}
        </div>
      </div>
    );
  }

  // ── permission states ────────────────────────────────────────────────
  if (
    state === "permissionDenied" ||
    state === "permissionSettingsGuide" ||
    state === "currentLocationPermission"
  ) {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState
            icon="map-pin"
            title={
              state === "currentLocationPermission" ? "현재 위치가 필요해요" : "위치 권한이 꺼져있어요"
            }
            description={
              state === "permissionSettingsGuide"
                ? "설정 > 위치에서 허용해주세요"
                : "정확한 지도를 보여드리려면 권한이 필요해요"
            }
            action={
              <Button
                onClick={
                  state === "currentLocationPermission" ? onRequestPermission : onOpenSettings
                }
              >
                {state === "currentLocationPermission" ? "권한 허용" : "설정 열기"}
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  // ── search states ────────────────────────────────────────────────────
  if (state.startsWith("search")) {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소 검색" onBack={onBack} />
        <div className="px-page py-3">
          <TextInput
            leftIcon="search"
            placeholder="장소를 검색해보세요"
            autoFocus={state === "searchTyping"}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
          />
        </div>
        <main
          className={cn(
            state === "searchEmpty" ? mobileMainCenter : mobileMainScroll,
            state !== "searchEmpty" && "px-3",
          )}
          onScroll={(e) => {
            if (state !== "searchResults") return;
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight <= 100) {
              onLoadMoreSearch?.();
            }
          }}
        >
          {state === "searchEmpty" ? (
            <EmptyState
              icon="search"
              title="검색 결과가 없어요"
              description="주소를 직접 입력할 수도 있어요"
            />
          ) : state === "searchResults" ? (
            <ul className="divide-y divide-border">
              {(searchResults ?? []).map((r) => (
                <li
                  key={r.placeId}
                  className="flex cursor-pointer items-center gap-3 px-3 py-3 active:bg-surface"
                  onClick={() => onSelectPlace?.(r)}
                >
                  <Icon name="map-pin" size="sm" color="inactive" decorative />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-text-primary">{r.placeName}</p>
                    <p className="truncate text-[12px] text-text-secondary">{r.address}</p>
                  </div>
                </li>
              ))}
              {isLoadingMoreSearch && (
                <li className="py-3 text-center text-[12px] text-text-tertiary">
                  불러오는 중...
                </li>
              )}
              {searchCapReached && !isLoadingMoreSearch && (
                <li className="py-3 text-center text-[12px] text-text-tertiary">
                  더 많은 결과가 있어요. 키워드를 더 구체적으로 입력해보세요
                </li>
              )}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-[13px] text-text-tertiary">
              {state === "searchInitial" ? "최근 검색 기록이 없어요" : "검색 중..."}
            </p>
          )}
        </main>
      </div>
    );
  }

  // ── selectedPlace / manualAddress ────────────────────────────────────
  if (state === "selectedPlace" || state === "manualAddress") {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <div className="relative flex-1">
          {mapSlot ?? <MapPlaceholder />}
          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col gap-2 p-4">
            <LocationCard
              variant="preview"
              placeName={placeName}
              address={state === "manualAddress" ? "직접 입력한 주소" : address}
              onGetDirections={onConfirmSelectedPlace ? undefined : onGetDirections}
              menuPlacement="top"
            />
            {onConfirmSelectedPlace && (
              <Button
                fullWidth
                size="lg"
                disabled={isSavingPlace}
                onClick={onConfirmSelectedPlace}
              >
                {isSavingPlace ? "저장 중..." : "이 장소로 설정하기"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── fullscreen / direction states ────────────────────────────────────
  const isDirectionOpen =
    state === "directionBottomSheet" ||
    state === "openKakaoMap" ||
    state === "openNaverMap" ||
    state === "openGoogleMap" ||
    state === "noMapAppGuide";

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title={placeName} onBack={onBack} />
      {trackingActive !== undefined ? (
        <span data-testid="location-tracking-active" className="sr-only">
          {trackingActive ? "active" : "inactive"}
        </span>
      ) : null}

      <div className="relative flex-1">
        {/* 지도 슬롯 */}
        {mapSlot ?? <MapPlaceholder />}

        {/* 도착 배너 */}
        {isArrived && (
          <div className="absolute inset-x-0 top-0 z-30 bg-success px-4 py-2 text-center text-[13px] font-semibold text-white">
            모임 장소 근처에 도착했어요. 위치 공유를 종료합니다.
          </div>
        )}

        {/* 내 위치 버튼 */}
        <button
          className="absolute right-4 top-4 z-30 inline-flex size-11 items-center justify-center rounded-full bg-surface shadow-md"
          onClick={onLocate}
        >
          <Icon name="locate" size="sm" color="primary" decorative />
        </button>

        {/* 하단 장소 카드 */}
        <div className="absolute inset-x-0 bottom-0 z-30 p-4">
          <LocationCard
            variant="preview"
            placeName={placeName}
            address={address}
            onGetDirections={onGetDirections}
            menuPlacement="top"
          />
        </div>
      </div>

      {/* 길찾기 BottomSheet */}
      <BottomSheet open={isDirectionOpen} onOpenChange={onCloseDirections ?? (() => {})}>
        <BottomSheetContent contained title="길찾기" description="원하는 지도 앱을 선택해주세요">
          {state === "noMapAppGuide" ? (
            <EmptyState
              icon="alert-triangle"
              title="설치된 지도 앱이 없어요"
              description="앱스토어에서 지도 앱을 설치해주세요"
            />
          ) : (
            <div className="flex flex-col gap-1">
              <ShareOptionItem
                icon="map"
                title="카카오맵"
                iconBg="bg-yellow-300"
                iconColor="text-gray-900"
                onClick={onOpenKakaoMap}
              />
              <ShareOptionItem
                icon="map"
                title="네이버 지도"
                iconBg="bg-green-50"
                iconColor="text-green-600"
                onClick={onOpenNaverMap}
              />
              <ShareOptionItem
                icon="map"
                title="구글 지도"
                iconBg="bg-blue-100"
                iconColor="text-blue-500"
                onClick={onOpenGoogleMap}
              />
            </div>
          )}
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
};
