"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { LocationCard } from "@/components/organisms/LocationCard";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { mockInvitation } from "@/lib/mockData";
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

export interface MapPageProps {
  state?: MapPageState;
  onBack?: () => void;
}

export const MapPage = ({ state = "fullscreen", onBack }: MapPageProps) => {
  if (state === "previewInInvitation") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <LocationCard
          variant="preview"
          placeName={mockInvitation.location}
          address={mockInvitation.address}
          mapPreviewUrl="https://placehold.co/640x360/EEF8FF/8DD4FF?text=Map"
        />
        </main>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-gray-100">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        </main>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className={mobileMainCenter}>
          <ErrorState title="지도를 불러오지 못했어요" onRetry={() => {}} />
        </main>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (state === "noLocation" || state === "onlineMeetingLink") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <div className="px-5 py-4">
          {state === "noLocation" ? (
            <LocationCard variant="unknown" />
          ) : (
            <LocationCard variant="online" onlineLink="https://meet.example.com/wara" />
          )}
        </div>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (state === "permissionDenied" || state === "permissionSettingsGuide" || state === "currentLocationPermission") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="지도" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState
            icon="map-pin"
            title={state === "currentLocationPermission" ? "현재 위치가 필요해요" : "위치 권한이 꺼져있어요"}
            description={state === "permissionSettingsGuide" ? "설정 > 위치에서 허용해주세요" : "정확한 지도를 보여드리려면 권한이 필요해요"}
            action={<Button>{state === "currentLocationPermission" ? "권한 허용" : "설정 열기"}</Button>}
          />
        </main>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  // Search states
  if (state.startsWith("search")) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소 검색" onBack={onBack} />
        <div className="px-5 py-3">
          <TextInput
            leftIcon="search"
            placeholder="장소를 검색해보세요"
            autoFocus={state === "searchTyping"}
            defaultValue={state === "searchResults" || state === "searchEmpty" ? "와라" : ""}
          />
        </div>
        <main
          className={cn(
            state === "searchEmpty" ? mobileMainCenter : mobileMainScroll,
            state !== "searchEmpty" && "px-3",
          )}
        >
          {state === "searchEmpty" ? (
            <EmptyState icon="search" title="검색 결과가 없어요" description="주소를 직접 입력할 수도 있어요" />
          ) : state === "searchResults" ? (
            <ul className="divide-y divide-border">
              {["와라 카페 (마포)", "와라 키친 (성수)", "와라 스튜디오 (강남)"].map((p) => (
                <li key={p} className="flex items-center gap-3 px-3 py-3">
                  <Icon name="map-pin" size="sm" color="inactive" decorative />
                  <span className="text-[14px] text-text-primary">{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-[13px] text-text-tertiary">
              {state === "searchInitial" ? "최근 검색 기록이 없어요" : "검색 중..."}
            </p>
          )}
        </main>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (state === "selectedPlace" || state === "manualAddress") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-[url('https://placehold.co/640x900/EEF8FF/8DD4FF?text=Map')] bg-cover bg-center" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <LocationCard
              variant="preview"
              placeName={mockInvitation.location}
              address={state === "manualAddress" ? "직접 입력한 주소" : mockInvitation.address}
            />
          </div>
        </div>
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  // fullscreen / direction sheets / map app open
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title={mockInvitation.location} onBack={onBack} />
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-[url('https://placehold.co/640x900/EEF8FF/8DD4FF?text=Map')] bg-cover bg-center" />
        <button className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-surface shadow-md">
          <Icon name="locate" size="sm" color="primary" decorative />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <LocationCard
            variant="preview"
            placeName={mockInvitation.location}
            address={mockInvitation.address}
          />
        </div>
      </div>

      <BottomSheet
        open={
          state === "directionBottomSheet" ||
          state === "openKakaoMap" ||
          state === "openNaverMap" ||
          state === "openGoogleMap" ||
          state === "noMapAppGuide"
        }
        onOpenChange={() => {}}
      >
        <BottomSheetContent contained title="길찾기" description="원하는 지도 앱을 선택해주세요">
          {state === "noMapAppGuide" ? (
            <EmptyState icon="alert-triangle" title="설치된 지도 앱이 없어요" description="앱스토어에서 지도 앱을 설치해주세요" />
          ) : (
            <div className="flex flex-col gap-1">
              <ShareOptionItem icon="map" title="카카오맵" iconBg="bg-yellow-300" iconColor="text-gray-900" />
              <ShareOptionItem icon="map" title="네이버 지도" iconBg="bg-[#03C75A]/20" iconColor="text-[#03C75A]" />
              <ShareOptionItem icon="map" title="구글 지도" iconBg="bg-sky-100" iconColor="text-sky-500" />
            </div>
          )}
        </BottomSheetContent>
      </BottomSheet>
      <MainBottomNav activeKey="invitations" />
    </div>
  );
};
