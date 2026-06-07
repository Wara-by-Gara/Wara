"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/icons";
import { HeaderGradient } from "@/components/layout/StickyHeader";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { HomeHeader } from "@/domain/Home/HomeHeader";
import { UpcomingMeetingsSection } from "@/domain/Home/UpcomingMeetingsSection";
import { PopularTemplatesSection } from "@/domain/Home/PopularTemplatesSection";
import { RecommendedEventsSection } from "@/domain/Home/RecommendedEventsSection";
import { getUpcomingInvitations } from "@/domain/Home/homeUtils";
import { useAuthStore } from "@/stores/authStore";
import { getMyInvitations } from "@/lib/api/invitations";
import { ROUTES } from "@/constants/routes";
import { stickyMainTop } from "@/lib/mobilePageLayout";
import { QUERY_KEYS } from "@/constants/queryKeys";

export default function HomeContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const { data: invitations, isLoading } = useQuery({
    queryKey: QUERY_KEYS.invitations.myList(),
    queryFn: getMyInvitations,
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  const upcoming = getUpcomingInvitations(invitations ?? [], 3);

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
        <HeaderGradient fixed />
        <TopAppBar className="relative z-30" brandLogo brandLogoCompact />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-page text-center">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">초대장을 더 특별하게</h1>
          <p className="text-[14px] text-text-secondary">로그인하고 첫 초대장을 만들어보세요</p>
          <Button variant="primary" size="lg" className="mt-2" onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}>
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <HomeHeader />

      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto ${stickyMainTop}`}>
        <div className="home-page-sections px-page pb-6 pt-4">
          <UpcomingMeetingsSection
            items={upcoming}
            rawInvitations={invitations ?? []}
            isLoading={isLoading}
          />
          <PopularTemplatesSection />
          <RecommendedEventsSection limit={4} />
        </div>
      </main>
    </div>
  );
}
