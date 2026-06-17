"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocationCard, InvitationInfoCard, LocationWeatherInline } from "@/components/domain";
import { LocationSetModal } from "./LocationSetModal";
import { useWeather } from "@/hooks/useWeather";
import { toWeatherCardCondition } from "@/lib/api/weather";
import { ROUTES } from "@/constants/routes";
import type { getInvitation } from "@/lib/api/invitations";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

type Props = {
  invitation: Invitation;
  isHost: boolean;
  invitationId: string;
  voteResultsHref?: string;
  showWeather?: boolean;
  /** 상세 헤더에 일시를 표시할 때 카드 숨김 */
  hideDateInHeader?: boolean;
  /** 상세 페이지 글래스 배경용 스타일 */
  immersive?: boolean;
  bgColor?: string;
};

export default function LocationWithDate({
  invitation,
  isHost,
  invitationId,
  voteResultsHref,
  showWeather = true,
  hideDateInHeader = false,
  immersive = false,
  bgColor,
}: Props) {
  const isDarkBg = bgColor?.includes('aurora') || bgColor?.includes('starry');
  const router = useRouter();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const eventLocation = invitation.eventLocation ?? null;
  const { data: weather, within3Days, isFuture } = useWeather(
    invitationId,
    invitation.eventStartAt,
    { enabled: showWeather },
  );

  const weatherSlot =
    showWeather && invitation.eventStartAt && isFuture && within3Days && weather ? (
      <LocationWeatherInline
        condition={toWeatherCardCondition(weather.condition)}
        temperatureCelsius={weather.temperature}
      />
    ) : null;

  return (
    <div className={immersive ? "flex flex-col divide-y divide-border" : "flex flex-col gap-3"}>
      {!hideDateInHeader && invitation.eventStartAt && (() => {
        const d = new Date(invitation.eventStartAt);
        const dateLabel = d.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        });
        const h = d.getHours();
        const m = d.getMinutes();
        const ampm = h < 12 ? "오전" : "오후";
        const h12 = h % 12 || 12;
        const timeLabel = m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${m}분`;
        return (
          <InvitationInfoCard
            variant="datetime"
            title={<time suppressHydrationWarning>{dateLabel}</time>}
            time={<time suppressHydrationWarning>{timeLabel}</time>}
            badge={voteResultsHref ? (
              <Link href={voteResultsHref}
                className="text-[11px] font-medium text-primary hover:underline transition-colors"
              >
                투표 결과
              </Link>
            ) : undefined}
            isDarkBg={isDarkBg}
          />
        );
      })()}

      <div className={immersive ? "pt-4" : undefined}>
        {eventLocation ? (
          <LocationCard
            variant="preview"
            immersive={immersive}
            isDarkBg={isDarkBg}
            placeName={eventLocation.placeName}
            address={
              eventLocation.detailAddress
                ? `${eventLocation.address} ${eventLocation.detailAddress}`
                : eventLocation.address
            }
            mapLat={eventLocation.lat}
            mapLng={eventLocation.lng}
            weatherSlot={weatherSlot}
            onViewMap={() => router.push(ROUTES.INVITATIONS.LOCATION(invitationId))}
          />
        ) : (
          <div className="flex flex-col gap-2.5 rounded-md border border-white/40 bg-white/20 px-4 py-3 shadow-xs backdrop-blur-md backdrop-saturate-150">
            <div className="flex gap-3">
              <span
                className={`shrink-0 text-[16px] font-semibold ${isDarkBg ? "text-white/70" : "text-text-disabled"}`}
              >
                장소
              </span>
              <span
                className={`min-w-0 flex-1 text-left text-[17px] leading-[1.6] ${isDarkBg ? "text-white" : "text-text"}`}
              >
                미정
              </span>
            </div>
            {isHost && (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="block w-full text-center text-[13px] text-primary"
              >
                장소 설정하기 →
              </button>
            )}
          </div>
        )}
      </div>

      {isHost && (
        <LocationSetModal
          invitationId={invitationId}
          open={locationModalOpen}
          onOpenChange={setLocationModalOpen}
        />
      )}
    </div>
  );
}
