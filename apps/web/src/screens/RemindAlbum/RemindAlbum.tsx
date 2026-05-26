"use client";

import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { PhotoViewer } from "@/components/organisms/PhotoViewer";
import { AlbumGridSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { albumViewerSampleSrc, mockComments, mockRemindPhotos } from "@/lib/mockData";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type RemindAlbumState =
  | "default"
  | "dateGrouped"
  | "loadingSkeleton"
  | "empty"
  | "error"
  | "viewerOpen";

export interface RemindAlbumProps {
  state?: RemindAlbumState;
  onBack?: () => void;
  /** 이벤트 제목 */
  eventTitle?: string;
  /** 이벤트 날짜 */
  eventDate?: string;
  /** 호스트 정보 */
  hostName?: string;
  hostAvatarUrl?: string;
}

const CENTERED_STATES: RemindAlbumState[] = ["empty", "error"];

export const RemindAlbum = ({
  state = "default",
  onBack,
  eventTitle = "와라의 생일 파티",
  eventDate = "2026년 5월 19일",
  hostName = "김와라",
  hostAvatarUrl = "https://i.pravatar.cc/80?img=18",
}: RemindAlbumProps) => {
  const mainCentered = CENTERED_STATES.includes(state);
  const photo = mockRemindPhotos[0]!;

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title="리마인드 앨범"
        onBack={onBack ?? (() => {})}
        rightSlot={
          <button
            type="button"
            aria-label="공유"
            className="inline-flex size-11 items-center justify-center text-text-secondary"
          >
            <Icon name="share" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      {/* 이벤트 헤더 카드 */}
      {state !== "empty" && state !== "error" && state !== "loadingSkeleton" ? (
        <div className="shrink-0 border-b border-border bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={hostAvatarUrl}
              alt={hostName}
              size="md"
              initial={hostName?.[0]}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-text-primary">
                {eventTitle}
              </p>
              <p className="mt-0.5 text-[13px] text-text-secondary">
                {eventDate}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5">
              <Icon name="retro-camera" size="sm" color="primary" decorative />
              <span className="text-[13px] font-semibold text-primary">
                {mockRemindPhotos.length}장
              </span>
            </div>
          </div>

          {/* 메모리 요약 배지 */}
          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-[12px] font-medium text-yellow-600">
              <Icon name="heart" size="xs" color="currentColor" decorative />
              베스트 {mockRemindPhotos.length}장
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-600">
              <Icon name="users" size="xs" color="currentColor" decorative />
              참여자 12명
            </span>
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          mainCentered ? mobileMainCenter : mobileMainScroll,
          !mainCentered && "px-3 py-3",
        )}
      >
        {state === "loadingSkeleton" ? (
          <AlbumGridSkeleton />
        ) : state === "error" ? (
          <ErrorState title="앨범을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "empty" ? (
          <EmptyState
            icon="retro-camera"
            title="아직 추억이 없어요"
            description="모임이 끝나면 여기에서 추억을 모아볼 수 있어요"
            action={<Button>사진 올리기</Button>}
          />
        ) : state === "dateGrouped" ? (
          <div className="flex flex-col gap-4">
            <PhotoGrid groupLabel="좋아요 TOP 3">
              {mockRemindPhotos.slice(0, 3).map((p) => (
                <PhotoGridItem key={p.id} src={p.src} alt="" />
              ))}
            </PhotoGrid>
            <PhotoGrid groupLabel="조회수 TOP 3">
              {mockRemindPhotos.slice(3, 6).map((p) => (
                <PhotoGridItem key={p.id} src={p.src} alt="" />
              ))}
            </PhotoGrid>
            <PhotoGrid groupLabel="댓글 TOP 3">
              {mockRemindPhotos.slice(6, 9).map((p) => (
                <PhotoGridItem key={p.id} src={p.src} alt="" />
              ))}
            </PhotoGrid>
          </div>
        ) : (
          <PhotoGrid columns={3}>
            {mockRemindPhotos.map((p) => (
              <PhotoGridItem
                key={p.id}
                src={p.src}
                alt=""
              />
            ))}
          </PhotoGrid>
        )}
      </main>

      {/* 사진 뷰어 */}
      {state === "viewerOpen" ? (
        <PhotoViewer
          open
          contained
          src={albumViewerSampleSrc}
          authorName={photo.authorName}
          authorAvatarUrl={photo.authorAvatarUrl}
          createdAt={photo.createdAt}
          variant="default"
          onOpenChange={(next) => {
            if (!next) onBack?.();
          }}
          onClose={onBack}
          onSave={() => {}}
          onShare={() => {}}
          likeCount={8}
          liked={false}
          commentCount={mockComments.length}
          comments={mockComments.slice(0, 3)}
          onLike={() => {}}
          onCommentSubmit={() => {}}
        />
      ) : null}
    </div>
  );
};
