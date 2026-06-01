"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Badge } from "@/components/primitives/Badge";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import ShareBottomSheet from "@/domain/InvitationDetail/Informations/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { ParticipantSummaryCard } from "@/components/organisms/ParticipantSummaryCard";
import InformationsContainer from "@/domain/InvitationDetail/Informations/Container/InformationsContainer";
import { ParticipantItem } from "@/components/organisms/ParticipantItem";
import { updateInvitationStatus, deleteInvitation } from "@/lib/api/invitations";
import type { getInvitation } from "@/lib/api/invitations";
import type { getParticipants } from "@/lib/api/participants";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import { FONT_CLASS, getParticipantDisplayName } from "@/domain/InvitationDetail/types";
import PhotoWithFeedbackContainer from "@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer";
import { usePoll, useVoteResults } from "@/hooks/useDateVote";
import { VotePreviewCard } from "@/domain/InvitationDetail/Container/VotePreviewCard";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;
type ParticipantsData = Awaited<ReturnType<typeof getParticipants>>;

type Props = {
  invitationId: string;
  invitation: Invitation;
  participantsData: ParticipantsData | undefined;
};

export default function HostView({ invitationId, invitation, participantsData }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: pollData } = usePoll(invitationId);
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId, { enabled: hasPoll });
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fontClass = FONT_CLASS[invitation.font] ?? "font-sans";
  const hasGif = invitation.mainCoverType === "gif";
  const hasImage = invitation.mainCoverType === "image" && !!invitation.mainImageUrl && !(invitation.mainImageKey?.includes("defaults/") ?? false);

  const summary = participantsData?.summary;
  const recentParticipants = participantsData?.participants.slice(0, 4) ?? [];

  const { mutate: submitStatusChange, isPending: isStatusPending } = useMutation({
    mutationFn: (status: "active" | "closed") => updateInvitationStatus(invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.detail(invitationId) });
      setMoreSheetOpen(false);
    },
  });

  const { mutate: submitDelete, isPending: isDeletePending } = useMutation({
    mutationFn: () => deleteInvitation(invitationId),
    onSuccess: () => router.replace(ROUTES.INVITATIONS.LIST),
    onError: (e) => {
      const code = e instanceof Error ? e.message : "";
      setDeleteError(
        code === "INVITATION_HAS_PARTICIPANTS"
          ? "참석자가 있는 초대장은 삭제할 수 없어요"
          : "삭제 중 오류가 발생했어요",
      );
    },
  });

  return (
    <div className={cn("relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col", invitation.bgColor, fontClass)}>
      <TopAppBar
        className="shrink-0"
        variant="transparent"
        onBack={() => router.back()}
        rightSlot={
          <div className="flex items-center">
            <button type="button" aria-label="공유" onClick={() => setShareSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
              <Icon name="share" size="lg" color="currentColor" decorative />
            </button>
            <button type="button" aria-label="더보기" onClick={() => setMoreSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
              <Icon name="more-horizontal" size="lg" color="currentColor" decorative />
            </button>
          </div>
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        <InvitationCover
          variant={hasGif || hasImage ? "image" : "color"}
          imageUrl={hasImage ? (invitation.mainImageUrl ?? undefined) : undefined}
          gifUrl={hasGif ? (invitation.mainGifUrl ?? undefined) : undefined}
          backgroundClass={invitation.bgColor}
          isHost
        />
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="host" size="md">호스트</Badge>
            <h1 className="truncate text-[22px] font-extrabold text-text-primary">{invitation.title}</h1>
          </div>
          {invitation.description ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">
              {invitation.description}
            </p>
          ) : null}
        </header>

        {summary && (
          <ParticipantSummaryCard
            variant="host"
            summary={{
              total: summary.totalCount,
              attending: summary.attendingCount,
              maybe: summary.undecidedCount,
              declined: summary.absentCount,
              noResponse: summary.totalCount - summary.attendingCount - summary.undecidedCount - summary.absentCount,
            }}
          />
        )}

        {hasPoll && pollData?.poll.status !== 'confirmed' && (
          <VotePreviewCard pollData={pollData} resultsData={resultsData} isHost onClick={() => router.push(ROUTES.INVITATIONS.VOTE(invitationId))} />
        )}

        <InformationsContainer
          invitation={invitation}
          isHost
          invitationId={invitationId}
          voteResultsHref={hasPoll && pollData?.poll.status === 'confirmed' ? ROUTES.INVITATIONS.VOTE(invitationId) : undefined}
        />

        {recentParticipants.length > 0 ? (
          <section className="rounded-3xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-text-primary">최근 응답</h3>
              <button
                type="button"
                className="text-[13px] text-primary"
                onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}
              >
                전체보기
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentParticipants.map(({ participant, user }) => (
                <ParticipantItem
                  key={participant.id}
                  name={getParticipantDisplayName(participant, user)}
                  handle={user.nickname ?? undefined}
                  avatarUrl={user.profileImageUrl ?? undefined}
                  status={participant.rsvpStatus === "attending" ? "attending" : participant.rsvpStatus === "undecided" ? "maybe" : "declined"}
                  isHost={participant.memberRole === "HOST"}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-border-strong bg-gray-50 p-5 text-center">
            <p className="text-[15px] font-semibold text-text-primary">아직 참석자가 없어요</p>
            <p className="mt-1 text-[13px] text-text-tertiary">링크를 공유해 친구들을 초대해보세요</p>
          </section>
        )}
        <PhotoWithFeedbackContainer invitationId={invitationId} />
      </main>

      <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />

      <BottomSheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <BottomSheetContent>
          <div className="flex flex-col pb-2">
            <button
              type="button"
              onClick={() => { setMoreSheetOpen(false); router.push(ROUTES.INVITATIONS.EDIT(invitationId)); }}
              className="flex h-14 items-center px-2 text-[16px] text-text-primary"
            >
              수정
            </button>
            <button
              type="button"
              disabled={isStatusPending}
              onClick={() => submitStatusChange(invitation.status === "closed" ? "active" : "closed")}
              className="flex h-14 items-center px-2 text-[16px] text-text-primary disabled:opacity-50"
            >
              {invitation.status === "closed" ? "마감 취소" : "초대 마감"}
            </button>
            <button
              type="button"
              onClick={() => { setMoreSheetOpen(false); setDeleteConfirmOpen(true); }}
              className="flex h-14 items-center px-2 text-[16px] text-danger"
            >
              삭제
            </button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteError(""); }}>
        <BottomSheetContent title="초대장 삭제" description="삭제하면 복구할 수 없어요. 정말 삭제할까요?">
          <div className="flex flex-col gap-2 pt-2">
            {deleteError && (
              <p className="text-center text-[13px] text-danger">{deleteError}</p>
            )}
            <Button fullWidth variant="danger" size="lg" disabled={isDeletePending} onClick={() => submitDelete()}>
              {isDeletePending ? "삭제 중..." : "삭제하기"}
            </Button>
            <Button fullWidth variant="outline" size="lg" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
