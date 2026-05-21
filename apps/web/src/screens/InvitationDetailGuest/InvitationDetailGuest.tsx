"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar, AvatarGroup } from "@/components/primitives/Avatar";
import { TextInput } from "@/components/primitives/TextInput";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { RSVPButtonGroup } from "@/components/molecules/RSVPButtonGroup";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { LocationCard } from "@/components/organisms/LocationCard";
import { ParticipantItem } from "@/components/organisms/ParticipantItem";
import { CommentItem } from "@/components/organisms/CommentItem";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { InvitationDetailSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { ConfirmModal } from "@/components/molecules/Modal";
import { StickyCTA } from "@/components/layout/StickyCTA";
import {
  mockInvitation,
  mockParticipants,
  mockComments,
  mockAlbumPreviewSrcs,
  mockAlbumPreviewBirthdaySrcs,
  mockAlbumPreviewOverflow,
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
  | "loginRequiredForRsvp";

export interface InvitationDetailGuestProps {
  state?: InvitationDetailGuestState;
  onBack?: () => void;
  onRsvp?: () => void;
}

function ParticipantAvatarStrip() {
  return (
    <AvatarGroup variant="separated" scrollable>
      <Avatar size="lg" alt="김현제" initial="김" host />
      <Avatar size="lg" alt="윤숙희" initial="윤" />
      <Avatar size="lg" alt="최우진" initial="최" />
      <Avatar size="lg" alt="김민성" initial="김" />
      <Avatar size="lg" alt="박수훈" initial="박" />
      <Avatar
        size="lg"
        initial="+12"
        className="bg-pink-100 text-[11px] font-bold text-pink-600"
      />
    </AvatarGroup>
  );
}

export const InvitationDetailGuest = ({ state = "public", onBack, onRsvp }: InvitationDetailGuestProps) => {
  const [rsvpOpen, setRsvpOpen] = useState(state === "rsvpBottomSheetOpen");
  const [cancelOpen, setCancelOpen] = useState(state === "cancelRsvpModal");

  // ── Access/permission gate states ────────────────────────────
  if (state === "loading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" onBack={onBack} />
        <div className="px-5"><InvitationDetailSkeleton /></div>
        <MainBottomNav activeKey="invitations" />
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
      <MainBottomNav activeKey="invitations" />
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
      <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  // ── Main detail view ─────────────────────────────────────────
  const showCover = state !== "withoutCoverImage";
  const showMap = state !== "locationUnknown" && state !== "onlineMeeting";
  const showOnline = state === "onlineMeeting";
  const isLongCollapsed = state === "longDescriptionCollapsed";
  const isLongExpanded = state === "longDescriptionExpanded";

  let ctaLabel = "참석 여부 선택하기";
  if (state === "alreadyResponded" || state === "editRsvp") ctaLabel = "응답 수정하기";
  if (state === "closedRsvp") ctaLabel = "응답이 마감되었어요";
  if (state === "fullCapacity") ctaLabel = "정원이 가득 찼어요";
  if (state === "loggedOut" || state === "loginRequiredForRsvp") ctaLabel = "로그인하고 참석하기";
  const ctaDisabled = state === "closedRsvp" || state === "fullCapacity";
  const isPublicDetail = state === "public";
  const commentPreviewLimit = isPublicDetail ? 10 : 2;
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
          <InvitationInfoCard
            variant="datetime"
            title={mockInvitation.date}
            time={mockInvitation.time}
          />
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
              <section className="rounded-3xl border border-border bg-surface p-4">
                <h3 className="text-[15px] font-bold text-text-primary">참석 여부</h3>
                <div className="mt-3">
                  <RSVPButtonGroup layout="horizontal-3" />
                </div>
              </section>
            </>
          ) : null}

          {state === "participantPreview" || state === "alreadyResponded" || state === "withCoverImage" ? (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">참석 {mockInvitation.rsvp?.current}명</h3>
                <button className="text-[13px] text-primary">전체보기</button>
              </div>
              <div className="flex flex-col">
                {mockParticipants.slice(0, 3).map((p) => (
                  <ParticipantItem key={p.id} name={p.name} avatarUrl={p.avatarUrl} status={p.status} isHost={p.isHost} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-[15px] font-bold text-text-primary">앨범</h3>
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

      {!isPublicDetail ? (
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: ctaLabel, onClick: () => { setRsvpOpen(true); onRsvp?.(); }, disabled: ctaDisabled }} />
        </div>
      ) : null}

      {/* RSVP Bottom Sheet */}
      <BottomSheet open={rsvpOpen} onOpenChange={setRsvpOpen}>
        <BottomSheetContent contained title="참석 여부" description="원하는 응답을 선택해주세요">
          <div className="pt-2">
            <RSVPButtonGroup layout="horizontal-3" />
            <p className="mt-3 text-center text-[13px] text-text-tertiary">언제든 수정할 수 있어요</p>
            <Button fullWidth size="lg" className="mt-3">제출하기</Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

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
          로그인하면 참석 응답·댓글·앨범 사진을 남길 수 있어요
        </div>
      ) : null}
      <MainBottomNav activeKey="invitations" />
    </div>
  );
};
