"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar, AvatarGroup } from "@/components/primitives/Avatar";
import { TextInput } from "@/components/primitives/TextInput";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { RsvpSection } from "@/domain/InvitationDetail/Rsvp/RsvpSection";
import type { RSVPValue } from "@/components/molecules/RSVPButtonGroup";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { LocationCard } from "@/components/organisms/LocationCard";
import { ParticipantItem } from "@/components/organisms/ParticipantItem";
import { CommentItem } from "@/components/organisms/CommentItem";
import { ParticipantProfileModal } from "@/components/organisms/ParticipantProfileModal";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { InvitationDetailSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { ConfirmModal } from "@/components/molecules/Modal";
import {
  mockInvitation,
  mockParticipants,
  mockComments,
  mockAlbumPreviewSrcs,
  mockAlbumPreviewBirthdaySrcs,
  mockAlbumPreviewOverflow,
  mockRemindPhotos,
} from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";
import { useState } from "react";

export type InvitationDetailGuestState =
  // Access states
  | "public"
  | "loggedOut"
  | "loggedIn"
  | "passwordRequired"
  | "passwordError"
  | "expired"
  | "deleted"
  | "private"
  | "permissionDenied"
  | "loading"
  | "error"
  // Content states
  | "withCoverImage"
  | "withoutCoverImage"
  | "longDescriptionCollapsed"
  | "longDescriptionExpanded"
  | "withMapPreview"
  | "locationUnknown"
  | "onlineMeeting"
  | "participantPreview"
  | "albumPreviewEmpty"
  | "albumPreviewFilled"
  | "commentPreviewEmpty"
  | "commentPreviewFilled"
  // RSVP states
  | "beforeRsvp"
  | "rsvpBottomSheetOpen"
  | "alreadyResponded"
  | "editRsvp"
  | "cancelRsvpModal"
  | "closedRsvp"
  | "fullCapacity"
  | "loginRequiredForRsvp"
  | "alreadyRespondedProfileOpen"
  | "publicMomentLog"
  | "dateVotePending";

export interface InvitationDetailGuestProps {
  state?: InvitationDetailGuestState;
  onBack?: () => void;
  onRsvp?: () => void;
  onPhotoUpload?: () => void;
  onMomentLog?: () => void;
}

function ParticipantAvatarStrip() {
  const attendingParticipants = mockParticipants.filter((p) => p.status === "attending");
  const visibleParticipants = attendingParticipants.slice(0, 5);
  const overflowCount = Math.max(attendingParticipants.length - visibleParticipants.length, 0);

  return (
    <AvatarGroup variant="separated" scrollable>
      {visibleParticipants.map((participant) => (
        <Avatar
          key={participant.id}
          size="lg"
          src={participant.avatarUrl}
          alt={participant.name}
          name={participant.name}
          host={participant.isHost}
        />
      ))}
      {overflowCount > 0 ? (
        <Avatar
          size="lg"
          initial={`+${overflowCount}`}
          className="bg-pink-100 text-[11px] font-bold text-pink-600"
        />
      ) : null}
    </AvatarGroup>
  );
}

export const InvitationDetailGuest = ({ state = "public", onBack, onRsvp: _onRsvp, onPhotoUpload, onMomentLog }: InvitationDetailGuestProps) => {
  const [cancelOpen, setCancelOpen] = useState(state === "cancelRsvpModal");
  const [profileModalOpen, setProfileModalOpen] = useState(state === "alreadyRespondedProfileOpen");
  const [selectedParticipantIdx, setSelectedParticipantIdx] = useState(0);

  const openProfile = (idx: number) => {
    setSelectedParticipantIdx(idx);
    setProfileModalOpen(true);
  };
  const selectedParticipant = mockParticipants[selectedParticipantIdx];

  // ── Access/permission gate states ────────────────────────────
  if (state === "loading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-2">
          <InvitationDetailSkeleton />
        </main>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" onBack={onBack} />
        <main className={mobileMainCenter}>
          <ErrorState title="초대장을 불러오지 못했어요" onRetry={() => {}} />
        </main>
      </div>
    );
  }

  if (state === "passwordRequired" || state === "passwordError") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="비공개 초대장" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 text-center">
          <Icon name="lock-keyhole" size="xl" color="primary" decorative />
          <p className="text-[18px] font-bold text-text-primary">비밀번호를 입력해주세요</p>
          <p className="text-[13px] text-text-secondary">호스트에게 받은 비밀번호를 입력하세요</p>
          <div className="mt-2 w-full max-w-xs">
            <TextInput type="password" placeholder="비밀번호" error={state === "passwordError" ? "틀려요" : undefined} />
            {state === "passwordError" ? (
              <p className="mt-1 text-[13px] text-danger">비밀번호가 일치하지 않아요</p>
            ) : null}
          </div>
          <Button className="mt-3" fullWidth>들어가기</Button>
        </main>
      </div>
    );
  }

  if (state === "expired" || state === "deleted" || state === "private" || state === "permissionDenied") {
    const map = {
      expired: { icon: "clock" as const, title: "만료된 초대 링크예요", description: "호스트에게 새 링크를 요청해보세요" },
      deleted: { icon: "trash" as const, title: "삭제된 초대장이에요", description: "이미 사라진 초대장은 다시 볼 수 없어요" },
      private: { icon: "eye-off" as const, title: "비공개 초대장이에요", description: "초대 링크가 필요해요" },
      permissionDenied: { icon: "lock" as const, title: "접근할 수 없어요", description: "호스트가 차단했어요" },
    };
    const info = map[state];
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon={info.icon} title={info.title} description={info.description} />
        </main>
      </div>
    );
  }

  // ── Main detail view ─────────────────────────────────────────
  const showCover = state !== "withoutCoverImage";
  const showMap = state !== "locationUnknown" && state !== "onlineMeeting";
  const showOnline = state === "onlineMeeting";
  const isLongCollapsed = state === "longDescriptionCollapsed";
  const isLongExpanded = state === "longDescriptionExpanded";

  const rsvpValue: RSVPValue | undefined =
    state === "alreadyResponded" || state === "alreadyRespondedProfileOpen" || state === "editRsvp"
      ? "attending"
      : undefined;
  const rsvpClosed = state === "closedRsvp";
  const rsvpFullCapacity = state === "fullCapacity";
  const isPublicDetail = state === "public" || state === "publicMomentLog";
  const albumPhotoCount =
    state === "albumPreviewEmpty" && !isPublicDetail
      ? 0
      : isPublicDetail
        ? mockAlbumPreviewBirthdaySrcs.length + mockAlbumPreviewOverflow
        : mockAlbumPreviewSrcs.length;
  const showMomentLog = state === "publicMomentLog";
  const commentPreviewLimit = isPublicDetail ? 15 : 2;
  const showCommentMore = isPublicDetail || state !== "commentPreviewEmpty";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        variant="transparent"
        onBack={onBack ?? (() => {})}
        rightSlot={
          <button type="button" aria-label="공유" className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="share" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6">
        {showCover ? (
          <InvitationCover
            variant="image"
            imageUrl={mockInvitation.coverImageUrl}
            ddayLabel={mockInvitation.ddayLabel}
            hideBottomGradient
          />
        ) : (
          <InvitationCover variant="no-image" />
        )}

        <header className="flex flex-col items-start gap-2 text-left">
          <h1 className="text-[26px] font-extrabold text-text-primary">{mockInvitation.title}</h1>
          <p className="flex items-center gap-2 text-[13px] text-text-tertiary">
            <Avatar src={mockInvitation.host.avatarUrl} alt={mockInvitation.host.name} size="xs" />
            <span>{mockInvitation.host.name} {mockInvitation.host.handle}</span>
          </p>
        </header>

        <p
          className={
            isLongCollapsed
              ? "whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary line-clamp-3"
              : "whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary"
          }
        >
          {isLongExpanded || isLongCollapsed
            ? "함께 모여서 즐겁게 보내요. 가벼운 음식과 음료가 준비되어 있어요. 편안한 옷차림으로 와주세요. 주차장은 건물 지하 1층 무료로 이용 가능합니다."
            : mockInvitation.description}
        </p>

        <div className="flex flex-col gap-3">
          {state === "dateVotePending" ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left transition-colors active:bg-amber-100"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Icon name="clock" size="md" color="currentColor" decorative className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">날짜 미정</p>
                <p className="text-[14px] font-bold text-text-primary">날짜 투표 진행 중</p>
                <p className="text-[12px] text-text-secondary">마감 2시간 30분 전 · 8명 참여</p>
              </div>
              <Icon name="chevron-right" size="sm" color="inactive" decorative />
            </button>
          ) : (
            <InvitationInfoCard
              variant="datetime"
              title={mockInvitation.date}
              time={mockInvitation.time}
            />
          )}
          {showMap ? (
            <LocationCard
              variant="preview"
              placeName={mockInvitation.location}
              address={mockInvitation.address}
              mapPreviewUrl="/jeonju-map-preview.png"
            />
          ) : showOnline ? (
            <LocationCard variant="online" onlineLink="https://meet.example.com/wara" />
          ) : (
            <LocationCard variant="unknown" />
          )}

          {state === "public" ? (
            <>
              <section className="rounded-3xl border border-border bg-surface p-4">
                <h3 className="text-[15px] font-bold text-text-primary">참석자 명단</h3>
                <div className="mt-3">
                  <ParticipantAvatarStrip />
                </div>
              </section>
            </>
          ) : null}

          {state === "participantPreview" || state === "alreadyResponded" || state === "alreadyRespondedProfileOpen" || state === "withCoverImage" ? (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">참석 {mockInvitation.rsvp?.current}명</h3>
                <button className="text-[13px] text-primary">전체보기</button>
              </div>
              <div className="flex flex-col">
                {mockParticipants
                  .filter((p) => p.status === "attending")
                  .slice(0, 3)
                  .map((p, idx) => (
                  <ParticipantItem
                    key={p.id}
                    name={p.name}
                    avatarUrl={p.avatarUrl}
                    status={p.status}
                    isHost={p.isHost}
                    onClick={() => openProfile(idx)}
                    className="cursor-pointer rounded-xl hover-emphasis-sm active:opacity-80"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <RsvpSection
            value={rsvpValue}
            closed={rsvpClosed}
            fullCapacity={rsvpFullCapacity}
            helperText={
              state === "loggedOut" || state === "loginRequiredForRsvp"
                ? "로그인하면 참석 응답을 남길 수 있어요"
                : undefined
            }
          />

          {/* 모먼트로그 버튼 — publicMomentLog 상태에서 앨범 위에 표시 */}
          {showMomentLog ? (
            <button
              type="button"
              onClick={onMomentLog}
              className="group w-full overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-left shadow-md transition-opacity active:opacity-80"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[18px] font-extrabold text-white">모먼트로그</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {mockRemindPhotos.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="size-14 overflow-hidden rounded-xl ring-2 ring-white/40"
                    >
                      {p.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.src} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-white/20" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ) : null}

          <section className="rounded-3xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-text-primary">사진 앨범</h3>
                <p className="text-[12px] text-text-secondary">{albumPhotoCount}개의 사진</p>
              </div>
              <button
                type="button"
                aria-label="사진 업로드"
                onClick={onPhotoUpload}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity active:opacity-70"
              >
                <Icon name="camera" size="sm" color="currentColor" decorative />
              </button>
            </div>
            {state === "albumPreviewEmpty" && !isPublicDetail ? (
              <p className="py-4 text-center text-[13px] text-text-tertiary">아직 사진이 없어요</p>
            ) : isPublicDetail ? (
              <PhotoGrid columns={3}>
                {mockAlbumPreviewBirthdaySrcs.map((src, i) => (
                  <PhotoGridItem key={`album-preview-${i}`} src={src} alt="" />
                ))}
                <PhotoGridItem overflowLabel={`+${mockAlbumPreviewOverflow}`} aria-label={`사진 ${mockAlbumPreviewOverflow}장 더보기`} />
              </PhotoGrid>
            ) : (
              <PhotoGrid columns={3}>
                {mockAlbumPreviewSrcs.slice(0, 3).map((src, i) => (
                  <PhotoGridItem key={`album-preview-${i}`} src={src} alt="" />
                ))}
              </PhotoGrid>
            )}
          </section>

          <section
            className={cn(
              "rounded-3xl border border-border bg-surface",
              isPublicDetail ? "px-2 py-4" : "p-4",
            )}
          >
            <h3
              className={cn(
                "mb-2 text-[15px] font-bold text-text-primary",
                isPublicDetail && "px-1",
              )}
            >
              {isPublicDetail ? `댓글 ${mockComments.length}` : "댓글"}
            </h3>
            {state === "commentPreviewEmpty" && !isPublicDetail ? (
              <p className="py-4 text-center text-[13px] text-text-tertiary">첫 댓글을 남겨보세요</p>
            ) : (
              <div className="divide-y divide-border">
                {mockComments.slice(0, commentPreviewLimit).map((c) => (
                  <CommentItem
                    key={c.id}
                    className={isPublicDetail ? "px-2" : undefined}
                    authorName={c.authorName}
                    authorAvatarUrl={c.authorAvatarUrl}
                    content={c.content}
                    createdAt={c.createdAt}
                    variant={c.variant}
                    replies={c.replies}
                  />
                ))}
              </div>
            )}
            {showCommentMore ? (
              <Button variant="outline" size="md" fullWidth className={cn("mt-3", isPublicDetail && "mx-1")}>
                더보기
              </Button>
            ) : null}
          </section>
        </div>
      </main>

      <ConfirmModal contained
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="응답을 취소할까요?"
        description="다시 응답하려면 처음부터 작성해야 해요"
        confirmLabel="취소"
        confirmVariant="danger"
      />

      {state === "loggedOut" ? (
        <div className="shrink-0 border-t border-border bg-surface px-5 py-3 text-center text-[13px] text-text-secondary">
          로그인하면 댓글·앨범 사진을 남길 수 있어요
        </div>
      ) : null}

      {/* 참석자 프로필 모달 */}
      {selectedParticipant ? (
        <ParticipantProfileModal
          contained
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          name={selectedParticipant.name}
          avatarUrl={selectedParticipant.avatarUrl}
          status={selectedParticipant.status}
          isHost={selectedParticipant.isHost}
          companionCount={selectedParticipant.companionCount}
          requestPreview={selectedParticipant.requestPreview}
          onDm={() => {}}
        />
      ) : null}
    </div>
  );
};
