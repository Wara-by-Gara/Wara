"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import ShareBottomSheet from "@/domain/InvitationDetail/Informations/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import InformationsContainer from "@/domain/InvitationDetail/Informations/Container/InformationsContainer";
import { getParticipants } from "@/lib/api/participants";
import type { getInvitation } from "@/lib/api/invitations";
import type { getMe } from "@/lib/api/users";
import { ROUTES } from "@/constants/routes";
import { FONT_CLASS } from "@/domain/InvitationDetail/types";
import ParticipantAvatarRow from "@/domain/InvitationDetail/Participants/ParticipantAvatarRow";
import PhotoWithFeedbackContainer from "@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer";
import { usePoll, useVoteResults } from "@/hooks/useDateVote";
import { VotePreviewCard } from "@/domain/InvitationDetail/Container/VotePreviewCard";
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

  const { data: pollData } = usePoll(invitationId);
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId, { enabled: hasPoll });

  const isLoggedIn = !!me;

  const { data: myParticipant } = useMyParticipant(invitationId, { enabled: isLoggedIn });
  const updateRsvp = useUpdateRsvp(invitationId);
  const joinInvitation = useJoinInvitation(invitationId);

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
  const hasGif = invitation.mainCoverType === "gif";
  const hasImage = invitation.mainCoverType === "image" && !!invitation.mainImageUrl && !(invitation.mainImageKey?.includes("defaults/") ?? false);

  const allParticipants = participantsData?.participants ?? [];
  const attendingParticipants = allParticipants.filter(
    ({ participant }) => participant.rsvpStatus === "attending",
  );

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

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
          variant={hasGif || hasImage ? "image" : "color"}
          imageUrl={hasImage ? (invitation.mainImageUrl ?? undefined) : undefined}
          gifUrl={hasGif ? (invitation.mainGifUrl ?? undefined) : undefined}
          backgroundClass={invitation.bgColor}
          hideBottomGradient
          fitToImage
        />

        <header className="flex flex-col items-start gap-2">
          <h1 className="text-[26px] font-extrabold text-text-primary">{invitation.title}</h1>
          {invitation.host && (
            <span className="flex items-center gap-2 text-[13px] text-text-tertiary">
              <Avatar
                src={invitation.host.profileImageUrl ?? undefined}
                alt={invitation.host.name ?? invitation.host.nickname ?? ""}
                name={invitation.host.name ?? invitation.host.nickname ?? undefined}
                size="xs"
              />
              <span>
                {invitation.host.name}{invitation.host.nickname ? <span className="ml-1 text-text-tertiary">@{invitation.host.nickname}</span> : null}
              </span>
            </span>
          )}
        </header>

        {invitation.description ? (
          <p className="whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary">
            {invitation.description}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {hasPoll && pollData?.poll.status !== 'confirmed' && (
            <VotePreviewCard pollData={pollData} resultsData={resultsData} isHost={false} onClick={() => router.push(ROUTES.INVITATIONS.VOTE(invitationId))} />
          )}

          <InformationsContainer
            invitation={invitation}
            isHost={false}
            invitationId={invitationId}
            voteResultsHref={hasPoll && pollData?.poll.status === 'confirmed' ? ROUTES.INVITATIONS.VOTE(invitationId) : undefined}
          />

          {isLoggedIn && participantsData && participantsData.summary.attendingCount > 0 && (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">
                  참석 {participantsData.summary.attendingCount}명/{participantsData.summary.totalCount}명
                </h3>
                <button
                  type="button"
                  className="text-[13px] text-primary"
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

        </div>

        {isLoggedIn && (
          <RsvpSection
            value={toRsvpButtonValue(myParticipant?.rsvpStatus)}
            onValueChange={handleRsvp}
            options={rsvpOptions}
            closed={invitation.status === "closed"}
            loading={updateRsvp.isPending || joinInvitation.isPending}
          />
        )}

        {isLoggedIn ? (
          <PhotoWithFeedbackContainer invitationId={invitationId} />
        ) : (
          <div className="relative overflow-hidden rounded-3xl">
            <div className="pointer-events-none select-none blur-sm">
              <div className="mb-3 rounded-3xl border border-border bg-surface p-4">
                <div className="mb-3 h-5 w-16 rounded bg-border" />
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-border" />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-surface p-4">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/60 backdrop-blur-sm">
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
        )}
      </main>

      {!isLoggedIn && (
        <div className="shrink-0 border-t border-border bg-surface px-5 py-3 text-center text-[13px] text-text-secondary">
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
