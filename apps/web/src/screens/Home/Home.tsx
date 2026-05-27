"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { Chip } from "@/components/primitives/Chip";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { SearchBar } from "@/components/molecules/SearchBar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { InvitationCard, type InvitationCardVariant } from "@/components/organisms/InvitationCard";
import { InvitationCardSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { NotificationBellContainer } from "@/domain/Notifications/NotificationBell/NotificationBellContainer";
import { mockInvitation, mockMe, mockTemplateSlides, type MockInvitation, type MockUser } from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";
import { useState } from "react";

export type HomeState =
  | "guestLanding"
  | "loggedInEmpty"
  | "loggedInFilled"
  | "todayHighlight"
  | "upcoming"
  | "draft"
  | "loadingSkeleton"
  | "networkError"
  | "pullToRefresh"
  | "fabMenuOpened"
  | "searchActivated"
  | "searchResults"
  | "searchEmpty"
  | "filterSheet";

export interface HomeProps {
  state?: HomeState;
  me?: MockUser;
  invitations?: (MockInvitation & { variant?: InvitationCardVariant })[];
}

export const Home = ({ state = "loggedInFilled", me = mockMe, invitations = [] }: HomeProps) => {
  const [filterOpen, setFilterOpen] = useState(state === "filterSheet");

  if (state === "guestLanding") {
    return (
      <div className="mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background">
        <TopAppBar title="Wara" brandLogo />
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">초대장을 더 특별하게</h1>
          <p className="text-[14px] text-text-secondary">로그인하고 첫 초대장을 만들어보세요</p>
          <Button variant="primary" size="lg" className="mt-2">시작하기</Button>
        </section>
        <MainBottomNav activeKey="home" />
      </div>
    );
  }

  const isSearch = state === "searchActivated" || state === "searchResults" || state === "searchEmpty";

  const isCenteredState =
    state === "loggedInEmpty" || state === "networkError" || state === "searchEmpty";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="shrink-0"
        title="WARA"
        largeTitle
        brandLogo
        rightSlot={
          <>
            <NotificationBellContainer />
            <Avatar size="sm" src={me.avatarUrl} alt={me.nickname} initial={me.nickname[0]} />
          </>
        }
      />

      {isSearch ? (
        <div className="shrink-0 px-5 pb-3 pt-5">
          <SearchBar
            showCancel
            placeholder="초대장 검색"
            autoFocus
            defaultValue={state === "searchResults" || state === "searchEmpty" ? "와라" : ""}
          />
        </div>
      ) : null}

      <main className={cn(isCenteredState ? mobileMainCenter : "min-h-0 flex-1 overflow-y-auto")}>
        {state === "loadingSkeleton" ? (
          <div className="flex flex-col gap-3 px-5 py-4">
            <InvitationCardSkeleton />
            <InvitationCardSkeleton />
          </div>
        ) : state === "networkError" ? (
          <ErrorState className="py-8" title="네트워크에 연결되지 않았어요" onRetry={() => {}} />
        ) : state === "loggedInEmpty" ? (
          <EmptyState
            className="py-8"
            icon="ticket"
            title="아직 초대장이 없어요"
            description="첫 모임을 Wara로 초대해보세요"
            action={<Button>초대장 만들기</Button>}
          />
        ) : state === "searchEmpty" ? (
          <EmptyState icon="search" title="검색 결과가 없어요" description="다른 키워드로 검색해보세요" />
        ) : (
          <div className="flex flex-col gap-5 pb-6">
            {state === "loggedInFilled" ? (
              <AutoSlide
                slides={mockTemplateSlides}
                intervalMs={2500}
                aspectClassName="aspect-[16/9]"
                rounded={false}
              />
            ) : null}
            <div className="flex flex-col gap-5 px-5 pt-4">
            {state === "todayHighlight" || state === "loggedInFilled" || state === "searchResults" ? (
              <section>
                <h2 className="mb-2 text-[15px] font-bold text-text-primary">오늘의 모임</h2>
                {(invitations[0] ?? mockInvitation) ? (
                  <InvitationCard
                    title={(invitations[0] ?? mockInvitation).title}
                    date={(invitations[0] ?? mockInvitation).date}
                    location={(invitations[0] ?? mockInvitation).location}
                    imageUrl={(invitations[0] ?? mockInvitation).coverImageUrl}
                    variant="today"
                  />
                ) : null}
              </section>
            ) : null}

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-text-primary">
                  {state === "upcoming" ? "다가오는" : state === "draft" ? "임시저장" : "다가오는 초대장"}
                </h2>
                <div className="flex gap-1.5">
                  <Chip variant="filter" onClick={() => setFilterOpen(true)}>필터</Chip>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {(invitations.length > 0 ? invitations : [{ ...mockInvitation, variant: undefined as InvitationCardVariant | undefined }]).map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    title={inv.title}
                    date={inv.date}
                    location={inv.location}
                    imageUrl={inv.coverImageUrl}
                    variant={inv.variant ?? (state === "draft" ? "draft" : "upcoming")}
                    participantsCount={inv.rsvp?.current}
                  />
                ))}
              </div>
            </section>
            </div>
          </div>
        )}
      </main>

      {state === "fabMenuOpened" ? (
        <div className="pointer-events-none absolute inset-0 z-30 bg-black/40 backdrop-blur-sm">
          <div className="pointer-events-auto absolute bottom-24 right-5 flex flex-col items-end gap-2">
            <button type="button" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-md">
              <Icon name="ticket" size="sm" decorative /> 초대장 만들기
            </button>
            <button type="button" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-md">
              <Icon name="palette" size="sm" decorative /> 템플릿 둘러보기
            </button>
          </div>
        </div>
      ) : null}

      <MainBottomNav activeKey="home" />

      <BottomSheet open={filterOpen} onOpenChange={setFilterOpen} modal={false} noBodyStyles>
        <BottomSheetContent contained title="필터" description="원하는 종류를 선택해주세요">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="ticket" title="내가 만든 초대장" iconBg="bg-pink-100" iconColor="text-pink-600" />
            <ShareOptionItem icon="user-check" title="초대 받은" iconBg="bg-sky-100" iconColor="text-sky-500" />
            <ShareOptionItem icon="hourglass" title="다가오는" iconBg="bg-yellow-100" iconColor="text-yellow-400" />
            <ShareOptionItem icon="clock" title="지난" iconBg="bg-gray-100" />
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
};
