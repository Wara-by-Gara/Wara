"use client";

import Link from "next/link";
import { LocationCard } from "@/components/organisms/LocationCard";
import { useInvitation } from "@/hooks/useInvitations";
import { ROUTES } from "@/constants/routes";

interface LocationWithDateProps {
  invitationId: string;
}

export default function LocationWithDate({ invitationId }: LocationWithDateProps) {
  const { data: invitation, isLoading } = useInvitation(invitationId);

  if (isLoading) return null;

  const eventLocation = invitation?.eventLocation ?? null;

  return (
    <div className="flex flex-col gap-3">
      {invitation?.eventStartAt && (
        <div>
          <p className="text-[12px] font-medium uppercase text-text-tertiary">일시</p>
          <p className="text-[15px] text-text-primary">
            <time suppressHydrationWarning>
              {new Date(invitation.eventStartAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 text-[12px] font-medium uppercase text-text-tertiary">장소</p>
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
          <LocationCard variant="unknown" />
        )}
      </div>
    </div>
  );
}
