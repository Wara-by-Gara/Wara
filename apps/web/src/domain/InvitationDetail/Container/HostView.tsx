'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/icons';
import { Button } from "@wara/ui";
import { TopAppBar } from "@wara/ui";
import { InvitationDetailPanes } from '@/domain/InvitationDetail/Container/InvitationDetailPanes';
import { HostActionRail } from '@/domain/InvitationDetail/Container/HostActionRail';
import { InvitationDescriptionBox } from '@/domain/InvitationDetail/InvitationDescriptionBox';
import { InvitationOptions } from '@/domain/InvitationDetail/InvitationOptions/InvitationOptions';
import { ImmersiveTopBarButton } from '@/domain/InvitationDetail/ImmersiveTopBarButton';
import { getInvitationDetailCover } from '@/domain/InvitationDetail/invitationDetailCover';
import { formatInvitationDetailSchedule } from '@/utils/formatInvitationDetailSchedule';
import { resolveInvitationBgClass } from '@/utils/resolveInvitationBgClass';
import { BottomSheet } from '@wara/ui';
import ShareBottomSheet from '@/domain/Invitation/ShareBottomSheet';
import { TextBlastSheet } from '@/domain/InvitationDetail/TextBlast/TextBlastSheet';
import { QuestionnaireSheet } from '@/domain/InvitationDetail/Questionnaire/QuestionnaireSheet';
import { FlyerSheet } from '@/domain/InvitationDetail/Flyer/FlyerSheet';
import { InvitationCover, ParticipantProfileModal } from '@/components/domain';
import { InvitationCherryBlossomEffect } from '@/domain/InvitationDetail/CherryBlossomRain';
import { InvitationAnimation } from '@/domain/InvitationCreate/InvitationAnimation';
import type { AnimationId } from '@/domain/InvitationCreate/constants';
import { RsvpSection } from '@/domain/InvitationDetail/Rsvp/RsvpSection';
import InformationsContainer from '@/domain/InvitationDetail/Informations/Container/InformationsContainer';
import ParticipantAvatarRow from '@/domain/InvitationDetail/Participants/ParticipantAvatarRow';
import ParticipantsContainer from '@/domain/InvitationDetail/Participants/ParticipantsContainer';
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
import { useCloneInvitation } from '@/hooks/useInvitations';
import { toast } from '@wara/ui';
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
  const [textBlastOpen, setTextBlastOpen] = useState(false);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [profileTarget, setProfileTarget] = useState<{ userId: string; name?: string; avatarUrl?: string } | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const { mutate: cloneInvitation, isPending: isCloning } = useCloneInvitation();

  const handleClone = () => {
    cloneInvitation(invitationId, {
      onSuccess: (created) => {
        setMoreSheetOpen(false);
        toast('초대장을 복제했어요');
        router.push(ROUTES.INVITATIONS.EDIT(created.id));
      },
      onError: () => toast.error('복제에 실패했어요. 다시 시도해주세요'),
    });
  };

  const fontClass = FONT_CLASS[invitation.font] ?? 'font-sans';
  const hasInvitationOptions = !!(
    invitation.fee?.trim() ||
    invitation.dressCode?.trim() ||
    invitation.parkingInfo?.trim()
  );
  const cover = getInvitationDetailCover(invitation);
  const schedule = formatInvitationDetailSchedule(invitation.eventStartAt);

  const attendingParticipants = (participantsData?.participants ?? []).filter(
    ({ participant }) => participant.rsvpStatus === 'attending',
  );

  // 호스트는 응답을 바꿀 수 없지만 게스트가 보는 RSVP 위치를 그대로 노출(읽기 전용)
  const rsvpOptions = {
    attending: { emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
    undecided: { emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
    absent: { emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
  };

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
    invitation.bgColor.includes('starry') ||
    invitation.bgColor.includes('dreamy');

  return (
    <div
      className={cn(
        'relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col overflow-hidden font-pretendard',
        'lg:h-auto lg:max-w-none lg:overflow-visible',
        isDarkBg ? 'text-white' : 'text-text',
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
          className="shrink-0 lg:hidden"
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
        <InvitationDetailPanes
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
          left={
            <>
              <div className="flex flex-col gap-2">
                <header className="flex flex-col gap-2 text-left">
                  <h1
                    className={cn(
                      'line-clamp-2 break-words pb-0.5 text-[28px] font-bold leading-[1.35] tracking-tight lg:text-[34px]',
                      isDarkBg ? 'text-white' : 'text-text',
                      fontClass,
                    )}
                  >
                    {invitation.title}
                  </h1>
                  {schedule ? (
                    <p
                      className={cn(
                        'text-[17px] leading-[1.35] lg:text-[19px]',
                        isDarkBg ? 'text-white' : 'text-text-muted',
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
                  <VotePreviewCard
                    pollData={pollData}
                    resultsData={resultsData}
                    isHost
                    onClick={() => router.push(ROUTES.INVITATIONS.VOTE(invitationId))}
                  />
                )}

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

                {/* 참석자 — 게스트와 동일 표시 (참석 N명 + 아바타). 요약카드/최근응답 제거 */}
                {participantsData && participantsData.summary.attendingCount > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h3
                        className={cn(
                          'text-[15px] font-bold',
                          isDarkBg ? 'text-white' : 'text-text',
                        )}
                      >
                        참석 {participantsData.summary.attendingCount}명/
                        {participantsData.summary.totalCount}명
                      </h3>
                      <button
                        type="button"
                        className={cn(
                          'text-[13px]',
                          isDarkBg ? 'text-white' : 'text-accent',
                        )}
                        onClick={() => setParticipantsOpen(true)}
                      >
                        전체보기
                      </button>
                    </div>
                    <ParticipantAvatarRow
                      participants={attendingParticipants}
                      currentUserId={invitation.userId}
                      currentUserProfileImageUrl={
                        invitation.host?.profileImageUrl ?? null
                      }
                      onSelect={setProfileTarget}
                    />
                  </section>
                )}
              </div>
            </>
          }
          rsvp={
            <RsvpSection
              value="attending"
              options={rsvpOptions}
              closed
              isDarkBg={isDarkBg}
              helperText="호스트는 참석으로 표시돼요"
            />
          }
          feed={<PhotoWithFeedbackContainer invitationId={invitationId} />}
          rail={
            <HostActionRail
              goingCount={participantsData?.summary.attendingCount ?? 0}
              onParticipants={() => setParticipantsOpen(true)}
              edit={{
                icon: 'edit',
                label: '수정',
                onClick: () => router.push(ROUTES.INVITATIONS.EDIT(invitationId)),
              }}
              textBlast={{
                icon: 'megaphone',
                label: '공지하기',
                onClick: () => setTextBlastOpen(true),
              }}
              invite={{
                icon: 'user-plus',
                label: '초대',
                onClick: () => setShareSheetOpen(true),
              }}
              more={{
                icon: 'more-horizontal',
                label: '더보기',
                onClick: () => setMoreSheetOpen(true),
              }}
            />
          }
        />

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

        <ShareBottomSheet
          invitationId={invitationId}
          open={shareSheetOpen}
          onOpenChange={setShareSheetOpen}
        />

        <TextBlastSheet
          invitationId={invitationId}
          open={textBlastOpen}
          onOpenChange={setTextBlastOpen}
        />

        <QuestionnaireSheet
          invitationId={invitationId}
          open={questionnaireOpen}
          onOpenChange={setQuestionnaireOpen}
        />

        <FlyerSheet
          invitation={invitation}
          open={flyerOpen}
          onOpenChange={setFlyerOpen}
        />

        <BottomSheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen} title="더보기" hideTitle>
            <div className="flex flex-col pb-2">
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  router.push(ROUTES.INVITATIONS.EDIT(invitationId));
                }}
                className="flex h-14 items-center px-2 text-[16px] text-text"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  setTextBlastOpen(true);
                }}
                className="flex h-14 items-center px-2 text-[16px] text-text"
              >
                단체 공지 보내기
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  setQuestionnaireOpen(true);
                }}
                className="flex h-14 items-center px-2 text-[16px] text-text"
              >
                맞춤 질문 관리
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  setFlyerOpen(true);
                }}
                className="flex h-14 items-center px-2 text-[16px] text-text"
              >
                플라이어 만들기
              </button>
              <button
                type="button"
                disabled={isCloning}
                onClick={handleClone}
                className="flex h-14 items-center px-2 text-[16px] text-text disabled:opacity-50"
              >
                {isCloning ? '복제 중...' : '초대장 복제'}
              </button>
              <button
                type="button"
                disabled={isStatusPending}
                onClick={() =>
                  submitStatusChange(
                    invitation.status === 'closed' ? 'active' : 'closed',
                  )
                }
                className="flex h-14 items-center px-2 text-[16px] text-text disabled:opacity-50"
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
          </BottomSheet>

        <BottomSheet
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) setDeleteError('');
          }}
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
                variant="secondary"
                size="lg"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                취소
              </Button>
            </div>
          </BottomSheet>
      </div>
    </div>
  );
}
