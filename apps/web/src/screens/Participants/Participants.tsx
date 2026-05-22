"use client";

import { Icon } from "@/components/icons";
import { Chip } from "@/components/primitives/Chip";
import { Button } from "@/components/primitives/Button";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { SearchBar } from "@/components/molecules/SearchBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { ConfirmModal } from "@/components/molecules/Modal";
import { ParticipantSummaryCard } from "@/components/organisms/ParticipantSummaryCard";
import { ParticipantItem, type ParticipantRsvp } from "@/components/organisms/ParticipantItem";
import { ParticipantListSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { mockParticipants, mockInvitation } from "@/lib/mockData";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type ParticipantsTab = "all" | "attending" | "maybe" | "declined" | "noResponse";

export type ParticipantsState =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "search"
  | "searchResult"
  | "searchEmpty"
  | "filterBottomSheet"
  | "sortBottomSheet"
  | "detailBottomSheet"
  | "hostMemoEdit"
  | "rsvpStatusChange"
  | "removeModal"
  | "guestLimited"
  | "attendeeView"
  | "hostManageView"
  | "loginRequired";

export interface ParticipantsProps {
  tab?: ParticipantsTab;
  state?: ParticipantsState;
  isHost?: boolean;
  onBack?: () => void;
}

const TAB_LABELS: Record<ParticipantsTab, string> = {
  all: "전체",
  attending: "참석",
  maybe: "미정",
  declined: "불참",
  noResponse: "미응답",
};

export const Participants = ({ tab = "all", state = "default", isHost = false, onBack }: ParticipantsProps) => {
  if (state === "loginRequired") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="참석자" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon="lock" title="로그인이 필요해요" description="참석자 명단은 로그인한 사용자만 볼 수 있어요" action={<Button>로그인</Button>} />
        </main>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  const filteredByTab = mockParticipants.filter((p) => tab === "all" || p.status === (tab as ParticipantRsvp));
  const attending = mockParticipants.filter((p) => p.status === "attending").length;
  const maybe = mockParticipants.filter((p) => p.status === "maybe").length;
  const declined = mockParticipants.filter((p) => p.status === "declined").length;
  const noResponse = mockParticipants.filter((p) => p.status === "noResponse").length;
  const mainCentered = state === "error" || state === "empty" || state === "searchEmpty";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0"
        title="참석자"
        onBack={onBack}
        rightSlot={
          <button type="button" aria-label="검색" className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="search" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <div className="px-5 py-3">
        <ParticipantSummaryCard
          variant={isHost || state === "hostManageView" ? "host" : "guest"}
          summary={{
            total: mockParticipants.length,
            attending,
            maybe,
            declined,
            noResponse,
            capacity: mockInvitation.rsvp?.capacity,
          }}
        />
      </div>

      {state === "search" || state === "searchResult" || state === "searchEmpty" ? (
        <div className="px-5 pb-2">
          <SearchBar showCancel placeholder="이름으로 검색" defaultValue={state !== "search" ? "박" : ""} />
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto px-5 py-2">
        {(Object.keys(TAB_LABELS) as ParticipantsTab[]).map((t) => (
          <Chip key={t} variant="filter" selected={t === tab}>{TAB_LABELS[t]}</Chip>
        ))}
      </div>

      <main className={cn(mainCentered ? mobileMainCenter : mobileMainScroll, !mainCentered && "px-3")}>
        {state === "loading" ? (
          <div className="py-2"><ParticipantListSkeleton /></div>
        ) : state === "error" ? (
          <ErrorState title="명단을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "empty" ? (
          <EmptyState icon="users-round" title="아직 참석자가 없어요" description="초대 링크를 공유해 친구들을 불러보세요" />
        ) : state === "searchEmpty" ? (
          <EmptyState icon="search" title="검색 결과가 없어요" />
        ) : (
          <div className="rounded-3xl bg-surface px-2 py-1">
            <div className="divide-y divide-border">
              {filteredByTab.map((p) => (
                <ParticipantItem
                  key={p.id}
                  name={p.name}
                  avatarUrl={p.avatarUrl}
                  status={p.status}
                  isHost={p.isHost}
                  companionCount={p.companionCount}
                  requestPreview={state === "guestLimited" ? undefined : p.requestPreview}
                  memo={isHost ? p.memo : undefined}
                  onMore={isHost ? () => {} : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomSheet open={state === "filterBottomSheet"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="필터">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="user-check" title="참석만" iconBg="bg-green-50" iconColor="text-green-600" />
            <ShareOptionItem icon="hourglass" title="미정" iconBg="bg-yellow-50" iconColor="text-yellow-400" />
            <ShareOptionItem icon="user-x" title="불참" iconBg="bg-gray-100" />
            <ShareOptionItem icon="memo" title="메모 있음" iconBg="bg-pink-100" iconColor="text-pink-600" />
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={state === "sortBottomSheet"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="정렬">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="clock" title="응답 빠른 순" iconBg="bg-gray-100" />
            <ShareOptionItem icon="hourglass" title="응답 늦은 순" iconBg="bg-gray-100" />
            <ShareOptionItem icon="user-round" title="이름순" iconBg="bg-gray-100" />
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={state === "detailBottomSheet" || state === "hostMemoEdit" || state === "rsvpStatusChange"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="박미라" description="참석 · 동반 1명">
          {state === "hostMemoEdit" ? (
            <div className="pt-2">
              <Textarea defaultValue="비건 / 알러지: 견과류" rows={3} />
              <Button fullWidth className="mt-3">저장</Button>
            </div>
          ) : state === "rsvpStatusChange" ? (
            <div className="flex flex-col gap-1 pt-2">
              <ShareOptionItem icon="user-check" title="참석으로" iconBg="bg-green-50" iconColor="text-green-600" />
              <ShareOptionItem icon="help-circle" title="미정으로" iconBg="bg-yellow-50" iconColor="text-yellow-400" />
              <ShareOptionItem icon="user-x" title="불참으로" iconBg="bg-gray-100" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 text-[14px]">
              <p className="text-text-secondary">&ldquo;비건 음식 가능한지 궁금해요&rdquo;</p>
              {isHost ? (
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth>메모</Button>
                  <Button variant="outline" size="sm" fullWidth>상태 변경</Button>
                  <Button variant="danger" size="sm" fullWidth>내보내기</Button>
                </div>
              ) : null}
            </div>
          )}
        </BottomSheetContent>
      </BottomSheet>

      <ConfirmModal contained open={state === "removeModal"} onOpenChange={() => {}} title="참석자를 명단에서 빼시겠어요?" description="다시 추가하려면 초대 링크가 필요해요" confirmLabel="내보내기" confirmVariant="danger" />
      <MainBottomNav activeKey="invitations" />
    </div>
  );
};
