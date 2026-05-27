"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { InvitationCard } from "@/components/organisms/InvitationCard";
import { InvitationCardSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { useAuthStore } from "@/stores/authStore";
import { getMyInvitations } from "@/lib/api/invitations";
import { mockTemplateSlides } from "@/lib/mockData";
import { ROUTES } from "@/constants/routes";

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return d >= tomorrowStart;
}

function getDdayLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const event = new Date(dateStr);
  event.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomeContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const { data: invitations, isLoading, isError } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: getMyInvitations,
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">초대장을 더 특별하게</h1>
          <p className="text-[14px] text-text-secondary">로그인하고 첫 초대장을 만들어보세요</p>
          <Button variant="primary" size="lg" className="mt-2" onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}>
            시작하기
          </Button>
        </div>
        <MainBottomNav activeKey="home" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <div className="flex flex-col gap-3 px-5 py-4">
          <InvitationCardSkeleton />
          <InvitationCardSkeleton />
        </div>
        <MainBottomNav activeKey="home" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <ErrorState className="py-8" title="네트워크에 연결되지 않았어요" onRetry={() => {}} />
        </div>
        <MainBottomNav activeKey="home" />
      </div>
    );
  }

  const active = (invitations ?? []).filter((inv) => inv.status !== "closed");
  const todayItems = active.filter((inv) => isToday(inv.eventStartAt));
  const upcomingItems = active
    .filter((inv) => isUpcoming(inv.eventStartAt))
    .sort((a, b) => new Date(a.eventStartAt!).getTime() - new Date(b.eventStartAt!).getTime());

  if (active.length === 0) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <EmptyState
            className="py-8"
            icon="ticket"
            title="아직 초대장이 없어요"
            description="첫 모임을 Wara로 초대해보세요"
            action={
              <Button onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}>초대장 만들기</Button>
            }
          />
        </div>
        <MainBottomNav activeKey="home" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pb-6">
          <AutoSlide
            slides={mockTemplateSlides}
            intervalMs={2500}
            aspectClassName="aspect-[16/9]"
            rounded={false}
          />
          <div className="flex flex-col gap-5 px-5">
            {todayItems.length > 0 ? (
              <section>
                <h2 className="mb-2 text-[15px] font-bold text-text-primary">오늘의 모임</h2>
                <div className="flex flex-col gap-3">
                  {todayItems.map((inv) => (
                    <InvitationCard
                      key={inv.id}
                      title={inv.title}
                      date={formatDate(inv.eventStartAt)}
                      location={inv.eventLocation?.placeName ?? ""}
                      imageUrl={inv.mainImageUrl ?? undefined}
                      variant="today"
                      onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(inv.id))}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {upcomingItems.length > 0 ? (
              <section>
                <h2 className="mb-2 text-[15px] font-bold text-text-primary">다가오는 초대장</h2>
                <div className="flex flex-col gap-3">
                  {upcomingItems.map((inv) => (
                    <InvitationCard
                      key={inv.id}
                      title={inv.title}
                      date={formatDate(inv.eventStartAt)}
                      location={inv.eventLocation?.placeName ?? ""}
                      imageUrl={inv.mainImageUrl ?? undefined}
                      variant="upcoming"
                      ddayLabel={getDdayLabel(inv.eventStartAt)}
                      onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(inv.id))}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
      <MainBottomNav activeKey="home" />
    </div>
  );
}
