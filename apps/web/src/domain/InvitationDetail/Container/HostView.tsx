'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/icons';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { InvitationDetailHero } from '@/domain/InvitationDetail/InvitationDetailHero';
import { InvitationDescriptionBox } from '@/domain/InvitationDetail/InvitationDescriptionBox';
import { ImmersiveTopBarButton } from '@/domain/InvitationDetail/ImmersiveTopBarButton';
import { getInvitationDetailCover } from '@/domain/InvitationDetail/invitationDetailCover';
import { formatInvitationDetailSchedule } from '@/utils/formatInvitationDetailSchedule';
import { resolveInvitationBgClass } from '@/utils/resolveInvitationBgClass';
import {
  BottomSheet,
  BottomSheetContent,
} from '@/components/molecules/BottomSheet';
import ShareBottomSheet from '@/domain/Invitation/ShareBottomSheet';
import { InvitationCover } from '@/components/organisms/InvitationCover';
import { InvitationCherryBlossomEffect } from '@/domain/InvitationDetail/CherryBlossomRain';
import { InvitationAnimation } from '@/domain/InvitationCreate/InvitationAnimation';
import type { AnimationId } from '@/domain/InvitationCreate/constants';
import { ParticipantSummaryCard } from '@/components/organisms/ParticipantSummaryCard';
import InformationsContainer from '@/domain/InvitationDetail/Informations/Container/InformationsContainer';
import { ParticipantItem } from '@/components/organisms/ParticipantItem';
import {
  updateInvitationStatus,
  deleteInvitation,
} from '@/lib/api/invitations';
import type {
  getInvitation,
  Invitation as InvitationListItem,
} from '@/lib/api/invitations';
import type { getParticipants } from '@/lib/api/participants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { FONT_CLASS } from '@/domain/InvitationDetail/types';
import PhotoWithFeedbackContainer from '@/domain/InvitationDetail/PhotoWithFeedback/Container/PhotoWithFeedbackContainer';
import { usePoll, useVoteResults } from '@/hooks/useDateVote';
import { VotePreviewCard } from '@/domain/InvitationDetail/Container/VotePreviewCard';

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;
type ParticipantsData = Awaited<ReturnType<typeof getParticipants>>;

type Props = {
  invitationId: string;
  invitation: Invitation;
  participantsData: ParticipantsData | undefined;
};

export default function HostView({
  invitationId,
  invitation,
  participantsData,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // eventStartAt이 확정된 초대장은 진행 중인 투표가 있을 수 없음 → 불필요한 vote 조회(404) 방지
  const { data: pollData } = usePoll(invitationId, {
    enabled: !invitation.eventStartAt,
  });
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId, {
    enabled: hasPoll,
  });
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fontClass = FONT_CLASS[invitation.font] ?? 'font-sans';
  const cover = getInvitationDetailCover(invitation);
  const schedule = formatInvitationDetailSchedule(invitation.eventStartAt);

  const summary = participantsData?.summary;
  const recentParticipants = participantsData?.participants.slice(0, 4) ?? [];

  const { mutate: submitStatusChange, isPending: isStatusPending } =
    useMutation({
      mutationFn: (status: 'active' | 'closed') =>
        updateInvitationStatus(invitationId, status),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.invitations.detail(invitationId),
        });
        setMoreSheetOpen(false);
      },
    });

  const { mutate: submitDelete, isPending: isDeletePending } = useMutation({
    mutationFn: () => deleteInvitation(invitationId),
    onSuccess: () => {
      // 캐시에서 즉시 제거하여 다음 화면에 잔존 카드/깜빡임 없도록
      const removeFromList = (old: InvitationListItem[] | undefined) =>
        (old ?? []).filter((inv) => inv.id !== invitationId);
      queryClient.setQueryData<InvitationListItem[]>(
        QUERY_KEYS.invitations.myList(),
        removeFromList,
      );
      queryClient.setQueryData<InvitationListItem[]>(
        QUERY_KEYS.invitations.all(),
        removeFromList,
      );
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.invitations.detail(invitationId),
      });
      router.replace(ROUTES.HOME);
    },
    onError: (e) => {
      const code = e instanceof Error ? e.message : '';
      setDeleteError(
        code === 'INVITATION_HAS_PARTICIPANTS'
          ? '참석자가 있는 초대장은 삭제할 수 없어요'
          : '삭제 중 오류가 발생했어요',
      );
    },
  });

  const pageBgClass = resolveInvitationBgClass(invitation.bgColor);
  const isDarkBg =
    invitation.bgColor.includes('aurora') ||
    invitation.bgColor.includes('starry');

  return (
    <div
      className={cn(
        'relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col overflow-hidden font-pretendard',
        isDarkBg ? 'text-white' : 'text-text-primary',
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
            <ImmersiveTopBarButton
              aria-label="뒤로가기"
              onClick={() => router.back()}
            >
              <Icon
                name="chevron-left"
                size="lg"
                color="currentColor"
                decorative
              />
            </ImmersiveTopBarButton>
          }
          rightSlot={
            <div className="flex items-center gap-1">
              <ImmersiveTopBarButton
                aria-label="공유"
                onClick={() => setShareSheetOpen(true)}
              >
                <Icon name="share" size="lg" color="currentColor" decorative />
              </ImmersiveTopBarButton>
              <ImmersiveTopBarButton
                aria-label="더보기"
                onClick={() => setMoreSheetOpen(true)}
              >
                <Icon
                  name="more-horizontal"
                  size="lg"
                  color="currentColor"
                  decorative
                />
              </ImmersiveTopBarButton>
            </div>
          }
        />
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page pb-6">
          <div className="flex flex-col gap-2">
            <InvitationDetailHero
              title={invitation.title}
              schedule={schedule}
              fontClass={fontClass}
              isDarkBg={isDarkBg}
              meta={
                <Badge variant="host" size="md">
                  호스트
                </Badge>
              }
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
              <InvitationDescriptionBox
                fontClass={fontClass}
                bgColor={invitation.bgColor}
              >
                {invitation.description}
              </InvitationDescriptionBox>
            ) : null}
          </div>

          {summary && (
            <ParticipantSummaryCard
              variant="host"
              summary={{
                total: summary.totalCount,
                attending: summary.attendingCount,
                maybe: summary.undecidedCount,
                declined: summary.absentCount,
                noResponse:
                  summary.totalCount -
                  summary.attendingCount -
                  summary.undecidedCount -
                  summary.absentCount,
              }}
              isDarkBg={isDarkBg}
            />
          )}

          {hasPoll && pollData?.poll.status !== 'confirmed' && (
            <VotePreviewCard
              pollData={pollData}
              resultsData={resultsData}
              isHost
              onClick={() => router.push(ROUTES.INVITATIONS.VOTE(invitationId))}
            />
          )}

          <div className="flex flex-col gap-8">
            <InformationsContainer
              invitation={invitation}
              isHost
              invitationId={invitationId}
              voteResultsHref={
                hasPoll && pollData?.poll.status === 'confirmed'
                  ? ROUTES.INVITATIONS.VOTE(invitationId)
                  : undefined
              }
              showWeather
              hideDateInHeader
              immersive
              bgColor={invitation.bgColor}
            />

            {recentParticipants.length > 0 ? (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3
                    className={cn(
                      'text-[14px] font-bold',
                      isDarkBg ? 'text-white' : 'text-text-primary',
                    )}
                  >
                    최근 응답
                  </h3>
                  <button
                    type="button"
                    className={cn(
                      'text-[13px]',
                      isDarkBg ? 'text-white' : 'text-text-primary',
                    )}
                    onClick={() =>
                      router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))
                    }
                  >
                    전체보기
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {recentParticipants.map(({ participant, user }) => (
                    <ParticipantItem
                      key={participant.id}
                      name={user.name ?? user.nickname ?? '이름 없음'}
                      handle={user.nickname ?? undefined}
                      avatarUrl={user.profileImageUrl ?? undefined}
                      status={
                        participant.rsvpStatus === 'attending'
                          ? 'attending'
                          : participant.rsvpStatus === 'undecided'
                            ? 'maybe'
                            : 'declined'
                      }
                      isHost={participant.memberRole === 'HOST'}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section className="text-center">
                <p
                  className={cn(
                    'text-[15px] font-semibold',
                    isDarkBg ? 'text-white' : 'text-text-primary',
                  )}
                >
                  아직 참석자가 없어요
                </p>
                <p
                  className={cn(
                    'mt-1 text-[13px]',
                    isDarkBg ? 'text-white/70' : 'text-text-tertiary',
                  )}
                >
                  링크를 공유해 친구들을 초대해보세요
                </p>
              </section>
            )}
            <PhotoWithFeedbackContainer invitationId={invitationId} />
          </div>
        </main>

        <ShareBottomSheet
          invitationId={invitationId}
          open={shareSheetOpen}
          onOpenChange={setShareSheetOpen}
        />

        <BottomSheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
          <BottomSheetContent>
            <div className="flex flex-col pb-2">
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  router.push(ROUTES.INVITATIONS.EDIT(invitationId));
                }}
                className="flex h-14 items-center px-2 text-[16px] text-text-primary"
              >
                수정
              </button>
              <button
                type="button"
                disabled={isStatusPending}
                onClick={() =>
                  submitStatusChange(
                    invitation.status === 'closed' ? 'active' : 'closed',
                  )
                }
                className="flex h-14 items-center px-2 text-[16px] text-text-primary disabled:opacity-50"
              >
                {invitation.status === 'closed' ? '참석 응답 다시 받기' : '참석 응답 마감'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  setDeleteConfirmOpen(true);
                }}
                className="flex h-14 items-center px-2 text-[16px] text-danger"
              >
                삭제
              </button>
            </div>
          </BottomSheetContent>
        </BottomSheet>

        <BottomSheet
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) setDeleteError('');
          }}
        >
          <BottomSheetContent
            title="초대장 삭제"
            description="삭제하면 복구할 수 없어요. 정말 삭제할까요?"
          >
            <div className="flex flex-col gap-2 pt-2">
              {deleteError && (
                <p className="text-center text-[13px] text-danger">
                  {deleteError}
                </p>
              )}
              <Button
                fullWidth
                variant="danger"
                size="lg"
                disabled={isDeletePending}
                onClick={() => submitDelete()}
              >
                {isDeletePending ? '삭제 중...' : '삭제하기'}
              </Button>
              <Button
                fullWidth
                variant="outline"
                size="lg"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                취소
              </Button>
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </div>
    </div>
  );
}
