"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button, TopAppBar, BottomSheet } from "@wara/ui";
import { HeaderGradient } from "@/components/layout/StickyHeader";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import { HomeHeader } from "@/domain/Home/HomeHeader";
import { UpcomingMeetingsSection } from "@/domain/Home/UpcomingMeetingsSection";
import { PopularTemplatesSection } from "@/domain/Home/PopularTemplatesSection";
import { RecommendedEventsSection } from "@/domain/Home/RecommendedEventsSection";
import { getUpcomingInvitations } from "@/domain/Home/homeUtils";
import { useAuthStore } from "@/stores/authStore";
import { getMyInvitations } from "@/lib/api/invitations";
import { API_BASE } from "@/lib/env";
import { ROUTES } from "@/constants/routes";
import { stickyMainTop } from "@/lib/mobilePageLayout";
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";

export default function HomeContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const { data: invitations, isLoading } = useQuery({
    queryKey: QUERY_KEYS.invitations.myList(),
    queryFn: getMyInvitations,
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  const upcoming = getUpcomingInvitations(invitations ?? [], 3);

  function handleSocialLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    window.location.href = `${API_BASE}/auth/${provider}/redirect`;
  }

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
        <HeaderGradient fixed />
        <TopAppBar
          className="relative z-30"
          variant="transparent"
          leftSlot={
            <span className="ml-[4px] text-[20px] font-bold leading-none tracking-wide text-white">
              WARA
            </span>
          }
        />

        <div className="relative z-10 flex flex-1 flex-col justify-end px-page pb-[calc(env(safe-area-inset-bottom)+32px)]">
          <div className="mb-8">
            <h1 className="text-[34px] font-extrabold leading-tight text-text">
              초대장을<br />더 특별하게 <span className="text-primary">✦</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              쉽게 만들고, 바로 공유하고,<br />함께 추억을 기록하세요
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
            >
              초대장 만들기 →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setLoginSheetOpen(true)}
            >
              로그인하기
            </Button>
            <p className="mt-1 text-center text-[12px] text-text-disabled">
              계정이 있으면 더 많은 기능을 이용할 수 있어요
            </p>
          </div>
        </div>

        <BottomSheet
          open={loginSheetOpen}
          onOpenChange={setLoginSheetOpen}
          title="로그인"
          description="소셜 계정으로 간편하게 시작하세요"
        >
          <div className="flex flex-col gap-2 pt-2">
            {(["kakao", "naver", "google", "apple"] as const).map((provider) => (
              <SocialLoginButton
                key={provider}
                provider={provider}
                loading={loadingProvider === provider}
                disabled={loadingProvider !== null}
                onClick={() => handleSocialLogin(provider)}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-text-disabled">
            시작 시{" "}
            <Link href={ROUTES.TERMS.SERVICE} className="underline">
              이용약관
            </Link>
            ·
            <Link href={ROUTES.TERMS.PRIVACY} className="underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다
          </p>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
      <HomeHeader />

      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto lg:mx-auto lg:w-full lg:max-w-5xl ${stickyMainTop}`}>
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
