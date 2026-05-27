"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { RSVPButtonGroup } from "@/components/molecules/RSVPButtonGroup";
import ShareBottomSheet from "@/domain/InvitationDetail/Informations/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { StickyCTA } from "@/components/layout/StickyCTA";
import {
  getMyParticipant,
  getParticipants,
  joinInvitation,
  updateRsvp,
  type RsvpStatus,
} from "@/lib/api/participants";
import type { getInvitation } from "@/lib/api/invitations";
import type { getMe } from "@/lib/api/users";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import { FONT_CLASS, RSVP_LABELS } from "@/domain/InvitationDetail/types";
import ParticipantAvatarRow from "@/domain/InvitationDetail/Participants/ParticipantAvatarRow";
import PhotoWithFeedbackContainer from "@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;
type Me = Awaited<ReturnType<typeof getMe>>;
type ParticipantsData = Awaited<ReturnType<typeof getParticipants>>;
type MyParticipant = Awaited<ReturnType<typeof getMyParticipant>>;

type Props = {
  invitationId: string;
  invitation: Invitation;
  me: Me | undefined;
  myParticipant: MyParticipant | undefined;
  participantsData: ParticipantsData | undefined;
};

export default function GuestView({ invitationId, invitation, me, myParticipant, participantsData }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const isLoggedIn = !!me;
  const fontClass = FONT_CLASS[invitation.font] ?? "font-sans";
  const hasImage = invitation.mainImageUrl && !invitation.mainImageKey.includes("defaults/");
  const eventDate = invitation.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "미정";
  const eventTime = invitation.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : undefined;

  const attendingParticipants = participantsData?.participants.filter(
    ({ participant }) => participant.rsvpStatus === "attending",
  ) ?? [];

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

  let ctaLabel = "참석 여부 선택하기";
  if (!isLoggedIn) ctaLabel = "로그인하고 참석하기";
  else if (myParticipant) ctaLabel = `응답 수정하기 (현재: ${RSVP_LABELS[myParticipant.rsvpStatus]})`;

  const { mutate: submitRsvp, isPending: isRsvpPending } = useMutation({
    mutationFn: (status: RsvpStatus) =>
      myParticipant
        ? updateRsvp(invitationId, myParticipant.id, status)
        : joinInvitation(invitationId, { rsvpStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myParticipant", invitationId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
      setRsvpOpen(false);
    },
  });

  return (
    <div className={cn("relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col", invitation.bgColor, fontClass)}>
      <TopAppBar
        className="shrink-0"
        variant="transparent"
        onBack={() => router.back()}
        rightSlot={
          <button type="button" aria-label="공유" onClick={() => setShareSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="share" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6">
        <InvitationCover
          variant={hasImage ? "image" : "color"}
          imageUrl={hasImage ? invitation.mainImageUrl : undefined}
          backgroundClass={invitation.bgColor}
          hideBottomGradient
        />

        <header className="flex flex-col items-start gap-2">
          <h1 className="text-[26px] font-extrabold text-text-primary">{invitation.title}</h1>
          {me && (
            <span className="flex items-center gap-2 text-[13px] text-text-tertiary">
              <Avatar src={me.profileImageUrl ?? undefined} alt={me.nickname ?? ""} size="xs" />
              <span>{me.nickname}</span>
            </span>
          )}
        </header>

        {invitation.description ? (
          <p className="whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary">
            {invitation.description}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <InvitationInfoCard variant="datetime" title={eventDate} time={eventTime} />
          <InvitationInfoCard
            variant="location"
            title={invitation.eventLocation?.placeName ?? "미정"}
            description={invitation.eventLocation?.address}
          />

          {isLoggedIn && participantsData && participantsData.participants.length > 0 && (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">
                  참석 {participantsData.summary.attendingCount}명
                </h3>
                <button
                  type="button"
                  className="text-[13px] text-primary"
                  onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}
                >
                  전체보기
                </button>
              </div>
              <ParticipantAvatarRow participants={attendingParticipants} />
            </section>
          )}
        </div>
        <PhotoWithFeedbackContainer invitationId={invitationId} />
      </main>

      {!isLoggedIn && (
        <div className="shrink-0 border-t border-border bg-surface px-5 py-3 text-center text-[13px] text-text-secondary">
          로그인하면 참석 응답을 남길 수 있어요
        </div>
      )}

      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: ctaLabel,
            onClick: () => {
              if (!isLoggedIn) { setLoginSheetOpen(true); return; }
              setRsvpOpen(true);
            },
          }}
        />
      </div>

      <MainBottomNav activeKey="invitations" />

      <BottomSheet open={rsvpOpen} onOpenChange={setRsvpOpen}>
        <BottomSheetContent contained title="참석 여부" description="원하는 응답을 선택해주세요">
          <div className="pt-2">
            <RSVPButtonGroup
              layout="horizontal-3"
              value={myParticipant?.rsvpStatus === "attending" ? "attending" : myParticipant?.rsvpStatus === "undecided" ? "maybe" : myParticipant ? "declined" : undefined}
              onValueChange={(v) => submitRsvp(v === "attending" ? "attending" : v === "maybe" ? "undecided" : "absent")}
            />
            <p className="mt-3 text-center text-[13px] text-text-tertiary">언제든 수정할 수 있어요</p>
            <Button fullWidth size="lg" className="mt-3" disabled={isRsvpPending}>
              {isRsvpPending ? "저장 중..." : "제출하기"}
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인이 필요해요" description="참석 응답을 남기려면 먼저 로그인해주세요">
          <div className="flex flex-col gap-2.5 pt-2">
            {(["kakao", "naver"] as const).map((provider) => {
              const config = {
                kakao: { label: "카카오로 시작하기", cls: "bg-[#FEE500] text-[#181600]", path: "kakao" },
                naver: { label: "네이버로 시작하기", cls: "bg-[#03C75A] text-white", path: "naver" },
              }[provider];
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("wara_oauth_return", window.location.pathname);
                    window.location.href = `${apiBase}/auth/${config.path}/redirect`;
                  }}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-bold ${config.cls}`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
