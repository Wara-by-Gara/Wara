"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { KakaoStaticMapPreview } from "@/components/molecules/KakaoStaticMapPreview";
import { Button } from "@/components/primitives/Button";
import { toast } from "@/components/molecules/Toast";
import { cn } from "@/lib/cn";

export interface LocationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카드 모드 */
  variant?: "preview" | "selected" | "online" | "unknown";
  /** 장소명 */
  placeName?: string;
  /** 주소 */
  address?: string;
  /** 지도 미리보기 좌표 */
  mapLat?: number;
  mapLng?: number;
  /** 온라인 모임 링크 (online 모드) */
  onlineLink?: string;
  /** 지도에서 보기 콜백 (preview 모드) */
  onViewMap?: () => void;
  /** 길찾기 콜백 */
  onGetDirections?: () => void;
  /** 주소 행 우측 날씨 슬롯 */
  weatherSlot?: ReactNode;
  /** 초대장 상세 글래스 배경용 */
  immersive?: boolean;
  /**
   * 주소 옆 지도 아이콘 메뉴(길찾기·복사) 펼침 방향.
   * - "bottom"(default): 아이콘 아래로 펼침
   * - "top": 위로 펼침. 카드가 화면 하단에 고정된 레이아웃에서 사용.
   */
  menuPlacement?: "bottom" | "top";
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(successMessage);
  } catch {
    toast.error("복사에 실패했어요");
  }
}

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function LocationActionMenu({
  open,
  onClose,
  items,
  className,
}: {
  open: boolean;
  onClose: () => void;
  items: { label: string; icon: IconName; onClick: () => void }[];
  className?: string;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        role="menu"
        className={cn(
          "absolute z-50 min-w-[168px] overflow-hidden rounded-xs bg-surface shadow-md",
          className,
        )}
      >
        {items.map((item, index) => (
          <div key={item.label}>
            {index > 0 ? <div className="h-px bg-border" /> : null}
            <button
              type="button"
              role="menuitem"
              onClick={item.onClick}
              className="flex w-full items-center justify-between gap-6 px-4 py-3 text-left text-[15px] text-text-primary transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
            >
              <span>{item.label}</span>
              <Icon name={item.icon} size="sm" color="currentColor" decorative />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  function LocationCard(
    {
      className,
      variant = "preview",
      placeName,
      address,
      mapLat,
      mapLng,
      onlineLink,
      onViewMap,
      onGetDirections,
      weatherSlot,
      immersive = false,
      menuPlacement = "bottom",
      ...props
    },
    ref,
  ) {
    const [addressMenuOpen, setAddressMenuOpen] = useState(false);
    const hasDirections =
      mapLat !== undefined && mapLng !== undefined && !!placeName;

    const closeAddressMenu = () => setAddressMenuOpen(false);

    const handleDirections = () => {
      if (hasDirections) {
        openExternalUrl(
          `https://map.kakao.com/link/to/${encodeURIComponent(placeName!)},${mapLat},${mapLng}`,
        );
      } else {
        const query = placeName ?? address;
        if (query) {
          openExternalUrl(`https://map.naver.com/v5/search/${encodeURIComponent(query)}`);
        }
      }
      closeAddressMenu();
    };

    const handleCopyAddress = async () => {
      if (!address) return;
      await copyToClipboard(address, "주소가 복사되었어요");
      closeAddressMenu();
    };

    const addressMenuItems = [
      { label: "길찾기", icon: "navigation" as const, onClick: handleDirections },
      { label: "복사하기", icon: "copy" as const, onClick: handleCopyAddress },
    ];

    if (variant === "unknown") {
      return (
        <div
          ref={ref}
          className={cn(
            immersive
              ? "flex flex-col gap-2 p-0 text-center"
              : "flex flex-col gap-2 rounded-md border border-dashed border-border-strong bg-background-soft p-5 text-center",
            className,
          )}
          {...props}
        >
          <Icon name="map-pin" size="lg" color="inactive" decorative className="mx-auto" />
          <p className="text-[15px] font-semibold text-text-primary">
            장소가 아직 정해지지 않았어요
          </p>
          <p className="text-[13px] text-text-tertiary">
            호스트가 장소를 정하면 알려드릴게요
          </p>
        </div>
      );
    }

    if (variant === "online") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 rounded-md border border-border bg-surface p-4",
            className,
          )}
          {...props}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xs bg-blue-100 text-blue-500">
            <Icon name="globe" size="lg" color="currentColor" decorative />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-text-primary">온라인 모임</p>
            <p className="truncate text-[13px] text-text-secondary">{onlineLink}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onlineLink && copyToClipboard(onlineLink, "링크가 복사되었어요")}
          >
            복사
          </Button>
        </div>
      );
    }

    const mapRadius = immersive ? "rounded-sm" : "rounded-md";

    return (
      <div
        ref={ref}
        className={cn(
          immersive
            ? "flex flex-col gap-3 p-0"
            : "flex flex-col gap-3 rounded-md border border-border bg-surface p-4",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-text-primary">
              {placeName}
            </p>
            {address ? (
              <div className="mt-0.5 flex items-center gap-[3px]">
                <p className="min-w-0 text-[14px] leading-[1.4] text-text-secondary">
                  {address}
                </p>
                <span className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="길찾기 · 복사"
                    aria-expanded={addressMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setAddressMenuOpen((open) => !open)}
                    className="inline-flex size-5 -translate-x-[2px] translate-y-[2px] items-center justify-center text-text-tertiary transition-colors duration-150 hover:text-text-primary"
                  >
                    <Icon name="map" size={14} color="currentColor" decorative />
                  </button>
                  <LocationActionMenu
                    open={addressMenuOpen}
                    onClose={closeAddressMenu}
                    items={addressMenuItems}
                    className={cn(
                      "left-0",
                      menuPlacement === "top"
                        ? "bottom-full mb-1"
                        : "top-full mt-1",
                    )}
                  />
                </span>
              </div>
            ) : null}
          </div>
          {weatherSlot}
        </div>
        {mapLat !== undefined && mapLng !== undefined ? (
          onViewMap ? (
            <button
              type="button"
              onClick={onViewMap}
              className={cn("w-full overflow-hidden transition-opacity hover:opacity-90", mapRadius)}
            >
              {/* StaticMap 마커는 SDK 기본 핸들러로 카카오 지도 외부 탭을 여는데,
                  button onClick(우리 페이지로 이동)과 중복 동작이 됨.
                  pointer-events-none으로 내부 클릭을 차단해 button 흐름만 살림. */}
              <div className="pointer-events-none">
                <KakaoStaticMapPreview
                  lat={mapLat}
                  lng={mapLng}
                  heightOffset={20}
                  className={mapRadius}
                  alt={placeName ?? "지도 미리보기"}
                />
              </div>
            </button>
          ) : (
            <KakaoStaticMapPreview
              lat={mapLat}
              lng={mapLng}
              heightOffset={20}
              className={mapRadius}
              alt={placeName ?? "지도 미리보기"}
            />
          )
        ) : null}
      </div>
    );
  },
);
