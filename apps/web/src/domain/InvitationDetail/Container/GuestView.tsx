"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/env";
import { Icon } from "@/components/icons";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import ShareBottomSheet from "@/domain/Invitation/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationCherryBlossomEffect } from "@/domain/InvitationDetail/CherryBlossomRain";
import InformationsContainer from "@/domain/InvitationDetail/Informations/Container/InformationsContainer";
import { getParticipants } from "@/lib/api/participants";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";
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

  return (
    <div
      className={cn(
        "relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col overflow-hidden font-pretendard text-text-primary",
        pageBgClass,
      )}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
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
          (isLoggedIn && invitation.isPublic) || !!myParticipant ? (
            <ImmersiveTopBarButton aria-label="공유" onClick={() => setShareSheetOpen(true)}>
              <Icon name="share" size="lg" color="currentColor" decorative />
            </ImmersiveTopBarButton>
          ) : undefined
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page pb-6">
        <div className="flex flex-col gap-2">
          <InvitationDetailHero
            title={invitation.title}
            schedule={schedule}
            fontClass={fontClass}
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
            <InvitationDescriptionBox fontClass={fontClass}>
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
          />

          {isLoggedIn && participantsData && participantsData.summary.attendingCount > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">
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
              <p className="text-[15px] font-semibold text-text-primary">로그인하면 앨범과 댓글을 볼 수 있어요</p>
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
            <p className="text-[14px] font-medium text-text-primary">참석 여부를 선택하면</p>
            <p className="mt-1 text-[13px] text-text-secondary">앨범과 댓글을 볼 수 있어요</p>
          </div>
          )}
        </div>
      </main>

      {!isLoggedIn && (
        <div className="shrink-0 border-t border-border bg-surface/90 px-page py-3 text-center text-[13px] text-text-secondary backdrop-blur-md">
          로그인하면 댓글·앨범 사진을 남길 수 있어요
        </div>
      )}

      <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />


<BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인이 필요해요" description="참석 응답을 남기려면 먼저 로그인해주세요">
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
        </BottomSheetContent>
      </BottomSheet>
      </div>
    </div>
  );
}
