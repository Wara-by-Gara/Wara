"use client";

import Link from "next/link";
import { LocationCard } from "@/components/organisms/LocationCard";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard/InvitationInfoCard";
import { ROUTES } from "@/constants/routes";
import type { getInvitation } from "@/lib/api/invitations";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

type Props = {
  invitation: Invitation;
  isHost: boolean;
  invitationId: string;
};

export default function LocationWithDate({ invitation, isHost, invitationId }: Props) {
  const eventLocation = invitation.eventLocation ?? null;

  return (
    <div className="flex flex-col gap-3">
      {invitation.eventStartAt && (() => {
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
          />
        );
      })()}

      <div>
        {eventLocation ? (
          <>
            <LocationCard
              variant="preview"
              placeName={eventLocation.placeName}
              address={
                eventLocation.detailAddress
                  ? `${eventLocation.address} ${eventLocation.detailAddress}`
                  : eventLocation.address
              }
              onCopyAddress={() => {
                navigator.clipboard.writeText(eventLocation.address).catch(() => {});
              }}
              onGetDirections={() => {
                const url = `https://map.kakao.com/link/to/${encodeURIComponent(eventLocation.placeName)},${eventLocation.lat},${eventLocation.lng}`;
                window.open(url, "_blank");
              }}
            />
            <Link
              href={ROUTES.INVITATIONS.LOCATION(invitationId)}
              className="mt-2 block text-center text-[13px] text-primary"
            >
              지도에서 보기 →
            </Link>
          </>
        ) : (
          <>
            <LocationCard variant="unknown" />
            {isHost && (
              <Link
                href={ROUTES.INVITATIONS.LOCATION(invitationId)}
                className="mt-2 block text-center text-[13px] text-primary"
              >
                장소 설정하기 →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
