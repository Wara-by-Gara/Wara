"use client";

import { useState } from "react";
import { BottomSheet } from "@wara/ui";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";
import { API_BASE } from "@/lib/env";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 비로그인 상태에서 프로필/로그인 탭을 누르면 뜨는 소셜 로그인 시트 */
export function LoginSheet({ open, onOpenChange }: LoginSheetProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  function handleSocialLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    window.location.href = `${API_BASE}/auth/${provider}/redirect`;
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="로그인"
      description="소셜 계정으로 간편하게 시작해보세요"
    >
      <div className="flex flex-col gap-2.5 pt-2">
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
    </BottomSheet>
  );
}
