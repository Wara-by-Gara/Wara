"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/env";
import { Icon } from "@/components/icons";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import ShareBottomSheet from "@/domain/Invitation/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationCherryBlossomEffect } from "@/domain/InvitationDetail/CherryBlossomRain";
import { InvitationAnimation } from "@/domain/InvitationCreate/InvitationAnimation";
import type { AnimationId } from "@/domain/InvitationCreate/constants";
import InformationsContainer from "@/domain/InvitationDetail/Informations/Container/InformationsContainer";
import { getParticipants } from "@/lib/api/participants";
import type { getInvitation } from "@/lib/api/invitations";
import type { getMe } from "@/lib/api/users";
import { ROUTES } from "@/constants/routes";
import { FONT_CLASS } from "@/domain/InvitationDetail/types";
import ParticipantAvatarRow from "@/domain/InvitationDetail/Participants/ParticipantAvatarRow";
import PhotoWithFeedbackContainer from "@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer";
import { InvitationFeedSkeleton } from "@/components/organisms/Skeleton";
import { usePoll, useVoteResults } from "@/hooks/useDateVote";
import { VotePreviewCard } from "@/domain/InvitationDetail/Container/VotePreviewCard";
import { InvitationDetailHero } from "@/domain/InvitationDetail/InvitationDetailHero";
import { InvitationDescriptionBox } from "@/domain/InvitationDetail/InvitationDescriptionBox";
import { InvitationOptions } from "@/domain/InvitationDetail/InvitationOptions/InvitationOptions";
import { ImmersiveTopBarButton } from "@/domain/InvitationDetail/ImmersiveTopBarButton";
import { getInvitationDetailCover } from "@/domain/InvitationDetail/invitationDetailCover";
import { formatInvitationDetailSchedule } from "@/utils/formatInvitationDetailSchedule";
import { resolveInvitationBgClass } from "@/utils/resolveInvitationBgClass";
import {
  RsvpSection,
  toRsvpButtonValue,
  fromRsvpButtonValue,
} from "@/domain/InvitationDetail/Rsvp/RsvpSection";
import { useMyParticipant, useUpdateRsvp, useJoinInvitation } from "@/hooks/useParticipants";
import type { RSVPValue } from "@/components/molecules/RSVPButtonGroup";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;
type Me = Awaited<ReturnType<typeof getMe>>;
type ParticipantsData = Awaited<ReturnType<typeof getParticipants>>;

type Props = {
  invitationId: string;
  invitation: Invitation;
  me: Me | undefined;
  participantsData: ParticipantsData | undefined;
};

export default function GuestView({ invitationId, invitation, me, participantsData }: Props) {
  const router = useRouter();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const isLoggedIn = !!me;

  // eventStartAt이 확정된 초대장은 진행 중인 투표가 있을 수 없음 → 불필요한 vote 조회(404) 방지
  const { data: pollData } = usePoll(invitationId, {
    enabled: !invitation.eventStartAt,
  });
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId, { enabled: isLoggedIn && hasPoll });
  const { data: myParticipant, isLoading: isLoadingMyParticipant } = useMyParticipant(
    invitationId,
    { enabled: isLoggedIn },
  );
  const updateRsvp = useUpdateRsvp(invitationId);
  const joinInvitation = useJoinInvitation(invitationId);
  const canViewFeed = !!myParticipant;

  const rsvpOptions = [
    { value: "attending" as const, emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
    { value: "maybe" as const, emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
    { value: "declined" as const, emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
  ];

  const handleRsvp = (next: RSVPValue) => {
    const rsvpStatus = fromRsvpButtonValue(next);
    if (myParticipant) {
      updateRsvp.mutate({ participantId: myParticipant.id, rsvpStatus });
    } else {
      joinInvitation.mutate({ rsvpStatus });
    }
  };
  const fontClass = FONT_CLASS[invitation.font] ?? "font-sans";
  const cover = getInvitationDetailCover(invitation);
  const schedule = formatInvitationDetailSchedule(invitation.eventStartAt);

  const allParticipants = participantsData?.participants ?? [];
  const attendingParticipants = allParticipants.filter(
    ({ participant }) => participant.rsvpStatus === "attending",
  );


  const pageBgClass = resolveInvitationBgClass(invitation.bgColor);
  const isDarkBg = invitation.bgColor.includes('aurora') || invitation.bgColor.includes('starry') || invitation.bgColor.includes('dreamy');

  return (
    <div
      className={cn(
        "relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col overflow-hidden font-pretendard",
        isDarkBg ? "text-white" : "text-text-primary",
        pageBgClass,
      )}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <InvitationAnimation
        effect={(invitation.animation as AnimationId) ?? 'none'}
        bgClass={pageBgClass}
        className="absolute inset-0 z-[1] pointer-events-none"
      />
      <InvitationCherryBlossomEffect title={invitation.title} />
      <TopAppBar
        className="shrink-0"
        variant="transparent"
        leftSlot={
          <ImmersiveTopBarButton aria-label="뒤로가기" onClick={() => router.back()}>
            <Icon name="chevron-left" size="lg" color="currentColor" decorative />
          </ImmersiveTopBarButton>
        }
        rightSlot={
          <ImmersiveTopBarButton aria-label="공유" onClick={() => setShareSheetOpen(true)}>
            <Icon name="share" size="lg" color="currentColor" decorative />
          </ImmersiveTopBarButton>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page pb-6">
        <div className="flex flex-col gap-2">
          <InvitationDetailHero
            title={invitation.title}
            schedule={schedule}
            fontClass={fontClass}
            isDarkBg={isDarkBg}
            cover={
              <InvitationCover
                variant={cover.variant}
                imageUrl={cover.imageUrl}
                gifUrl={cover.gifUrl}
                backgroundClass={invitation.bgColor}
                hideBottomGradient
                detailMode
              />
            }
          />

          {invitation.description ? (
            <InvitationDescriptionBox fontClass={fontClass} bgColor={invitation.bgColor}>
              {invitation.description}
            </InvitationDescriptionBox>
          ) : null}
        </div>

        <div className="flex flex-col gap-8">
          {hasPoll && pollData?.poll.status !== 'confirmed' && (
            <VotePreviewCard pollData={pollData} resultsData={resultsData} isHost={false} onClick={() => router.push(ROUTES.INVITATIONS.VOTE(invitationId))} />
          )}

          <InformationsContainer
            invitation={invitation}
            isHost={false}
            invitationId={invitationId}
            voteResultsHref={hasPoll && pollData?.poll.status === 'confirmed' ? ROUTES.INVITATIONS.VOTE(invitationId) : undefined}
            showWeather={isLoggedIn}
            hideDateInHeader
            immersive
            bgColor={invitation.bgColor}
          />

          <InvitationOptions
            fee={invitation.fee}
            dressCode={invitation.dressCode}
            parkingInfo={invitation.parkingInfo}
            fontClass={fontClass}
            bgColor={invitation.bgColor}
          />

          {isLoggedIn && participantsData && participantsData.summary.attendingCount > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={cn("text-[15px] font-bold", isDarkBg ? "text-white" : "text-text-primary")}>
                  참석 {participantsData.summary.attendingCount}명/{participantsData.summary.totalCount}명
                </h3>
                <button
                  type="button"
                  className="text-[13px] text-brand"
                  onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}
                >
                  전체보기
                </button>
              </div>
              <ParticipantAvatarRow
                participants={attendingParticipants}
                currentUserId={me?.id ?? null}
                currentUserProfileImageUrl={me?.profileImageUrl ?? null}
              />
            </section>
          )}

          {isLoggedIn && (
            <RsvpSection
              value={toRsvpButtonValue(myParticipant?.rsvpStatus)}
              onValueChange={handleRsvp}
              options={rsvpOptions}
              closed={invitation.status === "closed"}
              loading={updateRsvp.isPending || joinInvitation.isPending}
              isDarkBg={isDarkBg}
              helperText={
                invitation.status === "closed"
                  ? "호스트가 참석 응답을 마감했어요"
                  : undefined
              }
            />
          )}

          {!isLoggedIn ? (
          <div className="relative overflow-hidden rounded-sm">
            <div className="pointer-events-none select-none blur-sm">
              <div className="mb-3">
                <div className="mb-3 h-5 w-16 rounded bg-border" />
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-sm bg-border" />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 h-5 w-20 rounded bg-border" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-3 flex gap-2">
                    <div className="size-8 shrink-0 rounded-full bg-border" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 rounded bg-border" />
                      <div className="h-3 w-2/3 rounded bg-border" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/70 backdrop-blur-sm">
              <p className={cn("text-[15px] font-semibold", isDarkBg ? "text-white" : "text-text-primary")}>로그인하면 앨범과 댓글을 볼 수 있어요</p>
              <button
                type="button"
                onClick={() => setLoginSheetOpen(true)}
                className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-text-inverse"
              >
                로그인하기
              </button>
            </div>
          </div>
        ) : isLoadingMyParticipant || joinInvitation.isPending || updateRsvp.isPending ? (
          <InvitationFeedSkeleton />
        ) : canViewFeed ? (
          <PhotoWithFeedbackContainer invitationId={invitationId} />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center">
            <p className={cn("text-[14px] font-medium", isDarkBg ? "text-white" : "text-text-primary")}>참석 여부를 선택하면</p>
            <p className={cn("mt-1 text-[13px]", isDarkBg ? "text-white/70" : "text-text-secondary")}>앨범과 댓글을 볼 수 있어요</p>
          </div>
          )}
        </div>
      </main>

      {!isLoggedIn && (
        <div className={cn("shrink-0 border-t border-border bg-surface/90 px-page py-3 text-center text-[13px] backdrop-blur-md", isDarkBg ? "text-white/70" : "text-text-secondary")}>
          로그인하면 댓글·앨범 사진을 남길 수 있어요
        </div>
      )}

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
                    window.location.href = `${API_BASE}/auth/${config.path}/redirect`;
                  }}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-xs text-[16px] font-bold ${config.cls}`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </BottomSheetContent>
      </BottomSheet>
      </div>
    </div>
  );
}
