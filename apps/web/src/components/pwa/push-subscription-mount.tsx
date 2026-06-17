"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { usePushSubscription } from "@/hooks/usePushSubscription";

// 로그인 상태에서 앱 로드 시 웹푸시 구독을 보장(heal)한다.
// 구독은 기존에 온보딩/설정/알림 화면에서만 생성돼, 이미 온보딩한 유저가
// 구독 없이 남아 푸시가 안 오던 문제를 해결한다.
// enable()은 미지원 환경/권한 미허용 시 no-op이며, 권한 요청은 하지 않는다(프롬프트 없음).
export function PushSubscriptionMount() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { enable } = usePushSubscription();

  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    void enable().catch(() => {});
  }, [hydrated, isLoggedIn, enable]);

  return null;
}
