"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Chip } from "@/components/primitives/Chip";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { ConfirmModal } from "@/components/molecules/Modal";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { PhotoViewer } from "@/components/organisms/PhotoViewer";
import { AlbumGridSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { albumViewerSampleSrc, mockComments, mockPhotos } from "@/lib/mockData";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type AlbumState =
  | "emptyBeforeEvent"
  | "emptyAfterEvent"
  | "grid"
  | "dateGrouped"
  | "loadingSkeleton"
  | "error"
  | "permissionRequired"
  | "loginRequired"
  | "uploadFab"
  | "sortBottomSheet"
  | "hostManageMode"
  // upload sub-states
  | "uploadSourceSheet"
  | "uploadMultiSelect"
  | "uploadPreview"
  | "uploadProgress"
  | "uploadPartialFailed"
  | "uploadFailed"
  | "uploadComplete"
  // viewer states
  | "viewerOwnerMenu"
  | "viewerComments"
  | "viewerDelete"
  | "viewerReport";

export interface AlbumProps {
  state?: AlbumState;
  onBack?: () => void;
}

const ALBUM_MAIN_CENTERED: AlbumState[] = [
  "error",
  "emptyBeforeEvent",
  "emptyAfterEvent",
  "permissionRequired",
  "loginRequired",
];

/** 하단 탭·업로드 바 위에 FAB 노출 */
const ALBUM_HIDE_FAB: AlbumState[] = [
  "emptyBeforeEvent",
  "error",
  "permissionRequired",
  "loginRequired",
  "loadingSkeleton",
  "hostManageMode",
  "uploadMultiSelect",
  "uploadPreview",
  "uploadProgress",
  "uploadComplete",
  "uploadFailed",
  "uploadPartialFailed",
];

export const Album = ({ state = "grid", onBack }: AlbumProps) => {
  const mainCentered = ALBUM_MAIN_CENTERED.includes(state);
  const showUploadFab = !ALBUM_HIDE_FAB.includes(state);

  if (state.startsWith("viewer")) {
    const photo = mockPhotos[0]!;
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar
          className="shrink-0"
          title="앨범"
          onBack={onBack ?? (() => {})}
          rightSlot={
            <button type="button" aria-label="정렬" className="inline-flex size-11 items-center justify-center text-text-secondary">
              <Icon name="sort" size="lg" color="currentColor" decorative />
            </button>
          }
        />
        <main className={cn(mobileMainScroll, "px-3 py-3 opacity-40")}>
          <PhotoGrid columns={3}>
            {mockPhotos.map((p) => (
              <PhotoGridItem key={p.id} src={p.src} alt="" />
            ))}
          </PhotoGrid>
        </main>
        <PhotoViewer
          open
          contained
          src={albumViewerSampleSrc}
          authorName={photo.authorName}
          authorAvatarUrl={photo.authorAvatarUrl}
          createdAt={photo.createdAt}
          variant="owner"
          onOpenChange={(next) => {
            if (!next) onBack?.();
          }}
          onClose={onBack}
          onSave={() => {}}
          onShare={() => {}}
          onMore={() => {}}
          likeCount={12}
          liked={state === "viewerOwnerMenu" || state === "viewerComments"}
          commentCount={mockComments.length}
          commentsOpen={state === "viewerComments"}
          comments={mockComments.slice(0, 4)}
          onLike={() => {}}
          onCommentSubmit={() => {}}
        />
        <ConfirmModal
          contained
          open={state === "viewerDelete"}
          onOpenChange={() => {}}
          title="이 사진을 삭제할까요?"
          confirmLabel="삭제"
          confirmVariant="danger"
        />
        <ConfirmModal
          contained
          open={state === "viewerReport"}
          onOpenChange={() => {}}
          title="이 사진을 신고할까요?"
          description="검토 후 조치해드릴게요"
          confirmLabel="신고"
          confirmVariant="danger"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title="앨범"
        onBack={onBack ?? (() => {})}
        rightSlot={
          <button type="button" aria-label="정렬" className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="sort" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      {state === "hostManageMode" ? (
        <div className="flex items-center justify-between border-b border-border px-page py-2 text-[13px]">
          <span>3개 선택됨</span>
          <Button variant="danger" size="sm">삭제</Button>
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
          <ErrorState title="사진을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "emptyBeforeEvent" ? (
          <EmptyState
            icon="camera"
            title="모임 시작 후 사진을 모을 수 있어요"
            description="모임이 시작되면 함께 추억을 남길 수 있어요"
          />
        ) : state === "emptyAfterEvent" ? (
          <EmptyState
            icon="camera"
            title="아직 사진이 없어요"
            description="모임의 첫 사진을 올려보세요"
            action={<Button>사진 올리기</Button>}
          />
        ) : state === "permissionRequired" ? (
          <EmptyState icon="lock" title="권한이 필요해요" description="앨범 접근을 허용해주세요" action={<Button>권한 허용</Button>} />
        ) : state === "loginRequired" ? (
          <EmptyState icon="user-round-cog" title="로그인이 필요해요" description="로그인하면 사진을 함께 모을 수 있어요" action={<Button>로그인</Button>} />
        ) : state === "dateGrouped" ? (
          <div className="flex flex-col gap-4">
            <PhotoGrid groupLabel="오늘">
              {mockPhotos.slice(0, 3).map((p) => (
                <PhotoGridItem key={p.id} src={p.src} alt="" />
              ))}
            </PhotoGrid>
            <PhotoGrid groupLabel="어제">
              {mockPhotos.slice(3).map((p) => (
                <PhotoGridItem key={p.id} src={p.src} alt="" />
              ))}
            </PhotoGrid>
          </div>
        ) : (
          <PhotoGrid columns={3} selectMode={state === "hostManageMode"}>
            {mockPhotos.map((p, i) => (
              <PhotoGridItem
                key={p.id}
                src={p.src}
                alt=""
                status={
                  state === "uploadProgress" && i === 0
                    ? "uploading"
                    : state === "uploadPartialFailed" && i === 1
                      ? "failed"
                      : state === "hostManageMode" && i % 4 === 0
                        ? "selected"
                        : "default"
                }
                hostManageMode={state === "hostManageMode"}
              />
            ))}
          </PhotoGrid>
        )}
      </main>

      {showUploadFab ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end px-page pb-24">
          <button
            type="button"
            aria-label="사진 올리기"
            className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full bg-primary text-text-inverse shadow-lg"
          >
            <Icon name="plus" size="lg" color="currentColor" decorative />
          </button>
        </div>
      ) : null}

      <BottomSheet open={state === "uploadSourceSheet"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="사진 올리기">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="camera" title="카메라로 촬영" iconBg="bg-surface" />
            <ShareOptionItem icon="images" title="앨범에서 선택" iconBg="bg-surface" />
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={state === "sortBottomSheet"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="정렬">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="hourglass" title="최신순" iconBg="bg-cranberry-10" iconColor="text-cranberry-60" />
            <ShareOptionItem icon="clock" title="오래된순" iconBg="bg-surface" />
            <ShareOptionItem icon="heart" title="좋아요순 (V1.1+)" iconBg="bg-surface" />
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {state === "uploadMultiSelect" || state === "uploadPreview" ? (
        <div className="border-t border-border bg-surface p-4">
          <div className="mb-3 flex gap-1.5">
            {mockPhotos.slice(0, 5).map((p) => (
              <div key={p.id} className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <Button fullWidth>{state === "uploadPreview" ? "5장 올리기" : "선택"}</Button>
        </div>
      ) : null}

      {state === "uploadProgress" ? (
        <div className="border-t border-border bg-surface px-page py-4 text-center">
          <p className="text-[14px] text-text-secondary">사진 5장 중 2장 업로드 중...</p>
        </div>
      ) : null}

      {state === "uploadComplete" ? (
        <div className="border-t border-border bg-green-50 px-page py-4 text-center text-[14px] font-semibold text-green-600">
          업로드 완료!
        </div>
      ) : null}

      {state === "uploadFailed" || state === "uploadPartialFailed" ? (
        <div className="border-t border-border bg-red-50 px-page py-4 text-center">
          <p className="text-[13px] text-danger">
            {state === "uploadFailed" ? "업로드 실패" : "일부 사진 업로드 실패"}
          </p>
          <Button variant="text" size="sm">다시 시도</Button>
        </div>
      ) : null}

      <Chip className="sr-only">noop</Chip>
    </div>
  );
};
