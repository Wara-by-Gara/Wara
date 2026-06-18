"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/env";
import { Icon } from "@/components/icons";
import { TopAppBar } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import ShareBottomSheet from "@/domain/Invitation/ShareBottomSheet";
import { InvitationCover, ParticipantProfileModal } from "@/components/domain";
import { InvitationCherryBlossomEffect } from "@/domain/InvitationDetail/CherryBlossomRain";
import { InvitationAnimation } from "@/domain/InvitationCreate/InvitationAnimation";
import { BlackCatGridLayer } from "@/domain/InvitationCreate/BlackCatGrid/BlackCatGridLayer";
import { MasterpieceSlideLayer } from "@/domain/InvitationCreate/MasterpieceSlide/MasterpieceSlideLayer";
import type { AnimationId } from "@/domain/InvitationCreate/constants";
import InformationsContainer from "@/domain/InvitationDetail/Informations/Container/InformationsContainer";
import { getParticipants } from "@/lib/api/participants";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";
import type { getInvitation } from "@/lib/api/invitations";
import type { getMe } from "@/lib/api/users";
import { ROUTES } from "@/constants/routes";
import { FONT_CLASS } from "@/domain/InvitationDetail/types";
import ParticipantAvatarRow from "@/domain/InvitationDetail/Participants/ParticipantAvatarRow";
import ParticipantsContainer from "@/domain/InvitationDetail/Participants/ParticipantsContainer";
import PhotoWithFeedbackContainer from "@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer";
import { InvitationFeedSkeleton } from "@/components/domain/Skeleton";
import { usePoll, useVoteResults } from "@/hooks/useDateVote";
import { VotePreviewCard } from "@/domain/InvitationDetail/Container/VotePreviewCard";
import { InvitationDetailPanes } from "@/domain/InvitationDetail/Container/InvitationDetailPanes";
import { InvitationDescriptionBox } from "@/domain/InvitationDetail/InvitationDescriptionBox";
import { InvitationOptions } from "@/domain/InvitationDetail/InvitationOptions/InvitationOptions";
import { ImmersiveTopBarButton } from "@/domain/InvitationDetail/ImmersiveTopBarButton";
import { getInvitationDetailCover } from "@/domain/InvitationDetail/invitationDetailCover";
import { formatInvitationDetailSchedule } from "@/utils/formatInvitationDetailSchedule";
import { resolveInvitationBgClass } from "@/utils/resolveInvitationBgClass";
import { RsvpSection } from "@/domain/InvitationDetail/Rsvp/RsvpSection";
import { useMyParticipant, useUpdateRsvp, useJoinInvitation } from "@/hooks/useParticipants";
import type { RSVPValue } from "@/components/domain";

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
  const [profileTarget, setProfileTarget] = useState<{ userId: string; name?: string; avatarUrl?: string } | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  function handleSocialLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    sessionStorage.setItem("wara_oauth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/${provider}/redirect`;
  }

  const isLoggedIn = !!me;
  const mayHaveDateVote = invitation.dateVotePollStatus != null;

  const { data: myParticipant, isLoading: isLoadingMyParticipant } = useMyParticipant(
    invitationId,
    { enabled: isLoggedIn },
  );
  const { data: pollData } = usePoll(invitationId, {
    enabled: mayHaveDateVote && isLoggedIn && !!myParticipant,
  });
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId, { enabled: isLoggedIn && hasPoll });
  const updateRsvp = useUpdateRsvp(invitationId);
  const joinInvitation = useJoinInvitation(invitationId);
const canViewFeed = !!myParticipant;

  const rsvpOptions = {
    attending: { emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
    undecided: { emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
    absent: { emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
  };

  const handleRsvp = (next: RSVPValue) => {
    setRsvpError(null);
    // domain RSVPValue == RsvpStatus (attending/undecided/absent)
    if (myParticipant) {
      updateRsvp.mutate({ participantId: myParticipant.id, rsvpStatus: next });
    } else {
      joinInvitation.mutate({ rsvpStatus: next }, {
        onError: (err) => {
          if (err instanceof Error && err.message === 'INVITATION_ACCESS_REVOKED') {
            setRsvpError('참가가 제한된 초대장입니다.');
          }
        },
      });
    }
  };
  const fontClass = FONT_CLASS[invitation.font] ?? "font-sans";
  const hasInvitationOptions = !!(
    invitation.fee?.trim() ||
    invitation.dressCode?.trim() ||
    invitation.parkingInfo?.trim()
  );
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
        "lg:h-auto lg:max-w-none lg:overflow-visible",
        isDarkBg ? "text-white" : "text-text",
        pageBgClass,
      )}
    >
      {pageBgClass.includes('blackcat') && (
        <BlackCatGridLayer className="z-0" />
      )}
      {pageBgClass.includes('masterpiece') && (
        <MasterpieceSlideLayer className="z-0" />
      )}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <InvitationAnimation
        effect={(invitation.animation as AnimationId) ?? 'none'}
        bgClass={pageBgClass}
        className="absolute inset-0 z-1 pointer-events-none"
      />
      <InvitationCherryBlossomEffect title={invitation.title} />
      <TopAppBar
        className="shrink-0 lg:hidden"
        variant="transparent"
        leftSlot={
          <ImmersiveTopBarButton aria-label="뒤로가기" onClick={() => router.back()}>
            <Icon name="chevron-left" size="lg" color="currentColor" decorative />
          </ImmersiveTopBarButton>
        }
        rightSlot={
          (isLoggedIn && invitation.isPublic) || !!myParticipant ? (
            <ImmersiveTopBarButton aria-label="공유" onClick={() => setShareSheetOpen(true)}>
              <Icon name="share" size="lg" color="currentColor" decorative />
            </ImmersiveTopBarButton>
          ) : undefined
        }
      />

      <InvitationDetailPanes
        cover={
          <>
            <InvitationCover
              variant={cover.variant}
              imageUrl={cover.imageUrl}
              gifUrl={cover.gifUrl}
              backgroundClass={invitation.bgColor}
              hideBottomGradient
              detailMode
            />
            {(isLoggedIn && invitation.isPublic) || !!myParticipant ? (
              <button
                type="button"
                onClick={() => setShareSheetOpen(true)}
                className="mt-3 hidden w-full items-center justify-center gap-2 rounded-full bg-surface/80 py-2.5 text-[14px] font-semibold text-text ring-1 ring-border transition-colors hover:bg-surface lg:inline-flex"
              >
                <Icon name="share" size="sm" color="currentColor" decorative />
                공유하기
              </button>
            ) : null}
          </>
        }
        left={
          <>
            <div className="flex flex-col gap-3">
              <header className="flex flex-col gap-0.75 text-left">
                <h1
                  className={cn(
                    "line-clamp-2 wrap-break-word pb-0.5 text-[34px] font-extrabold leading-[1.35] tracking-tight lg:text-[36px]",
                    isDarkBg ? "text-white" : "text-text",
                    fontClass,
                  )}
                >
                  {invitation.title}
                </h1>
                {schedule ? (
                  <p
                    className={cn(
                      "text-[19px] leading-[1.35] lg:text-[21px]",
                      isDarkBg ? "text-white" : "text-text-muted",
                    )}
                  >
                    {schedule}
                  </p>
                ) : null}
              </header>

              {invitation.description ? (
                <InvitationDescriptionBox
                  bgColor={invitation.bgColor}
                  footer={
                    hasInvitationOptions ? (
                      <InvitationOptions
                        embedded
                        fee={invitation.fee}
                        dressCode={invitation.dressCode}
                        parkingInfo={invitation.parkingInfo}
                        bgColor={invitation.bgColor}
                      />
                    ) : undefined
                  }
                >
                  {invitation.description}
                </InvitationDescriptionBox>
              ) : (
                <InvitationOptions
                  fee={invitation.fee}
                  dressCode={invitation.dressCode}
                  parkingInfo={invitation.parkingInfo}
                  bgColor={invitation.bgColor}
                />
              )}
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

              {isLoggedIn && participantsData && participantsData.summary.attendingCount > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={cn("text-[18px] font-bold", isDarkBg ? "text-white" : "text-text")}>
                      참석자 · {participantsData.summary.attendingCount}명
                    </h3>
                    <button
                      type="button"
                      className="text-[13px] text-accent"
                      onClick={() => setParticipantsOpen(true)}
                    >
                      전체보기
                    </button>
                  </div>
                  <ParticipantAvatarRow
                    participants={attendingParticipants}
                    currentUserId={me?.id ?? null}
                    currentUserProfileImageUrl={me?.profileImageUrl ?? null}
                    onSelect={setProfileTarget}
                  />
                </section>
              )}
            </div>
          </>
        }
        rsvp={
          isLoggedIn ? (
            <RsvpSection
              value={myParticipant?.rsvpStatus}
              onValueChange={handleRsvp}
              options={rsvpOptions}
              closed={invitation.status === "closed"}
              loading={updateRsvp.isPending || joinInvitation.isPending}
              isDarkBg={isDarkBg}
              helperText={
                rsvpError ??
                (invitation.status === "closed"
                  ? "호스트가 참석 응답을 마감했어요"
                  : undefined)
              }
            />
          ) : null
        }
        feed={
          !isLoggedIn ? (
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
              <p className={cn("text-[15px] font-semibold", isDarkBg ? "text-white" : "text-text")}>로그인하면 앨범과 댓글을 볼 수 있어요</p>
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
            <p className={cn("text-[14px] font-medium", isDarkBg ? "text-white" : "text-text")}>참석 여부를 선택하면</p>
            <p className={cn("mt-1 text-[13px]", isDarkBg ? "text-white/70" : "text-text-muted")}>앨범과 댓글을 볼 수 있어요</p>
          </div>
          )
        }
      />

      <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />

      <ParticipantProfileModal
        open={!!profileTarget}
        onOpenChange={(open) => !open && setProfileTarget(null)}
        userId={profileTarget?.userId}
        name={profileTarget?.name}
        avatarUrl={profileTarget?.avatarUrl}
      />

      {participantsOpen ? (
        <ParticipantsContainer onClose={() => setParticipantsOpen(false)} />
      ) : null}


<BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} title="로그인이 필요해요" description="참석 응답을 남기려면 먼저 로그인해주세요">
          <div className="flex flex-col gap-2 pt-2">
            {(["kakao", "naver", "google", "apple"] as const).map((provider) => (
              <SocialLoginButton
                key={provider}
                provider={provider}
                loading={loadingProvider === provider}
                disabled={loadingProvider !== null}
                onClick={() => handleSocialLogin(provider)}
              />
            ))}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
