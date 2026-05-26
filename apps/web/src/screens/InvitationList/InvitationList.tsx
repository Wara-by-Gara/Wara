"use client";

import { Icon } from "@/components/icons";
import { Chip } from "@/components/primitives/Chip";
import { SearchBar } from "@/components/molecules/SearchBar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { ConfirmModal } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { MenuItem } from "@/components/molecules/MenuItem";
import { InvitationCard, type InvitationCardVariant } from "@/components/organisms/InvitationCard";
import { InvitationCardSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { Button } from "@/components/primitives/Button";
import { mockInvitation, type MockInvitation } from "@/lib/mockData";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type InvitationListTab = "all" | "createdByMe" | "invited" | "joined" | "draft" | "ended";

export type InvitationListState =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "search"
  | "searchResult"
  | "searchEmpty"
  | "filterApplied"
  | "cardMoreMenu"
  | "deleteConfirm"
  | "leaveConfirm"
  | "duplicateConfirm";

export interface InvitationListProps {
  tab?: InvitationListTab;
  state?: InvitationListState;
  invitations?: (MockInvitation & { variant?: InvitationCardVariant })[];
  onBack?: () => void;
  onCardClick?: (id: string) => void;
}

const TAB_LABELS: Record<InvitationListTab, string> = {
  all: "전체",
  createdByMe: "내가 만든",
  invited: "초대받은",
  joined: "참여한",
  draft: "임시저장",
  ended: "종료됨",
};

const sample = [
  mockInvitation,
  { ...mockInvitation, id: "i2", title: "주말 브런치", date: "5월 25일 일요일 · 오전 11시", coverImageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch" },
  { ...mockInvitation, id: "i3", title: "북클럽 1월", date: "6월 1일 · 오후 8시", coverImageUrl: "https://placehold.co/640x360/8DD4FF/171717?text=Book" },
];

export const InvitationList = ({
  tab = "all",
  state = "default",
  invitations = sample,
  onBack,
  onCardClick,
}: InvitationListProps) => {
  const isSearch = state === "search" || state === "searchResult" || state === "searchEmpty";
  const mainCentered = state === "error" || state === "empty" || state === "searchEmpty";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0" title="초대장"
        onBack={onBack}
        rightSlot={
          <button type="button" aria-label="검색" className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="search" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <div className="shrink-0 flex flex-nowrap gap-1.5 overflow-x-auto px-5 py-3 scrollbar-hide">
        {(Object.keys(TAB_LABELS) as InvitationListTab[]).map((t) => (
          <Chip key={t} variant="filter" selected={t === tab} className="shrink-0">{TAB_LABELS[t]}</Chip>
        ))}
      </div>

      {isSearch ? (
        <div className="px-5 pb-2">
          <SearchBar
            showCancel
            placeholder="초대장 검색"
            defaultValue={state === "searchResult" || state === "searchEmpty" ? "와라" : ""}
          />
        </div>
      ) : null}

      {state === "filterApplied" ? (
        <div className="flex items-center gap-2 px-5 pb-2 text-[12px] text-text-secondary">
          <Icon name="filter" size="xs" color="currentColor" decorative />
          <span>다가오는 + 초대받은</span>
          <button className="ml-auto text-primary">초기화</button>
        </div>
      ) : null}

      <main className={cn(mainCentered ? mobileMainCenter : mobileMainScroll)}>
        {state === "loading" ? (
          <div className="flex flex-col gap-3 px-5 py-3">
            <InvitationCardSkeleton />
            <InvitationCardSkeleton />
            <InvitationCardSkeleton />
          </div>
        ) : state === "error" ? (
          <ErrorState title="초대장 목록을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "empty" ? (
          <EmptyState
            icon="ticket"
            title="아직 초대장이 없어요"
            description="첫 모임을 Wara로 초대해보세요"
            action={<Button>초대장 만들기</Button>}
          />
        ) : state === "searchEmpty" ? (
          <EmptyState icon="search" title="검색 결과가 없어요" description="다른 키워드로 검색해보세요" />
        ) : (
          <div className="flex flex-col gap-3 px-5 py-3">
            {invitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                title={inv.title}
                date={inv.date}
                location={inv.location}
                imageUrl={inv.coverImageUrl}
                variant={inv.variant ?? tab === "draft" ? "draft" : tab === "ended" ? "ended" : "default"}
                onClick={() => onCardClick?.(inv.id)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomSheet open={state === "cardMoreMenu"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="초대장">
          <div className="flex flex-col">
            <MenuItem leftIcon="share">공유하기</MenuItem>
            <MenuItem leftIcon="copy">복제</MenuItem>
            <MenuItem leftIcon="edit">수정</MenuItem>
            <MenuItem leftIcon="trash" variant="danger">삭제</MenuItem>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <ConfirmModal contained
        open={state === "deleteConfirm"}
        onOpenChange={() => {}}
        title="초대장을 삭제할까요?"
        description="참석자 응답과 댓글이 모두 사라져요"
        confirmLabel="삭제"
        confirmVariant="danger"
      />
      <ConfirmModal contained
        open={state === "leaveConfirm"}
        onOpenChange={() => {}}
        title="초대장에서 나갈까요?"
        description="다시 들어오려면 초대 링크가 필요해요"
        confirmLabel="나가기"
        confirmVariant="danger"
      />
      <ConfirmModal contained
        open={state === "duplicateConfirm"}
        onOpenChange={() => {}}
        title="이 초대장을 복제할까요?"
        description="설정값은 그대로, 참석자는 비어있어요"
        confirmLabel="복제"
      />
      <MainBottomNav activeKey="invitations" />
    </div>
  );
};
