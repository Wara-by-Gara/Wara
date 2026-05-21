"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { ConfirmModal } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { useState, useEffect } from "react";

export type LoginState =
  | "default"
  | "withInvitationContext"
  | "kakaoLoading"
  | "naverLoading"
  | "googleLoading"
  | "socialFailed"
  | "socialCancelled"
  | "accountBlocked"
  | "withdrawnAccount"
  | "sessionExpiredModal"
  | "loginRequiredBottomSheet"
  | "continueWithoutLogin";

export interface LoginProps {
  state?: LoginState;
  /** 초대장 컨텍스트가 있는 경우 표시할 제목 */
  invitationTitle?: string;
  onKakao?: () => void;
  onNaver?: () => void;
  onGoogle?: () => void;
  onContinueWithoutLogin?: () => void;
}

const SocialButton = ({
  provider,
  loading,
  onClick,
}: {
  provider: "kakao" | "naver" | "google";
  loading?: boolean;
  onClick?: () => void;
}) => {
  const label = provider === "kakao" ? "카카오로 시작하기" : provider === "naver" ? "네이버로 시작하기" : "Google로 시작하기";
  const bg = provider === "kakao" ? "bg-[#FEE500] text-[#181600]" : provider === "naver" ? "bg-[#03C75A] text-white" : "bg-white text-[#3c4043] border border-[#dadce0]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-[18px] font-bold text-[16px] transition-opacity disabled:opacity-60 ${bg}`}
    >
      {loading ? (
        <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : provider === "google" ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <Icon name={(provider + "-logo") as "kakao-logo" | "naver-logo"} size="md" decorative />
      )}
      <span>{label}</span>
    </button>
  );
};

export const Login = ({
  state = "default",
  invitationTitle,
  onKakao,
  onNaver,
  onGoogle,
  onContinueWithoutLogin,
}: LoginProps) => {
  const [mounted, setMounted] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(state === "sessionExpiredModal");
  const [loginSheetOpen, setLoginSheetOpen] = useState(state === "loginRequiredBottomSheet");

  useEffect(() => { setMounted(true); }, []);

  const errorMessage =
    state === "socialFailed"
      ? "로그인에 실패했어요. 잠시 후 다시 시도해주세요."
      : state === "socialCancelled"
        ? "로그인이 취소되었어요."
        : state === "accountBlocked"
          ? "이용이 제한된 계정이에요. 고객센터에 문의해주세요."
          : state === "withdrawnAccount"
            ? "탈퇴한 계정이에요. 30일 후 다시 가입할 수 있어요."
            : null;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <section className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-primary-soft">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
        </div>
        <h1 className="text-[24px] font-extrabold text-text-primary">Wara에 오신 걸 환영해요</h1>
        {state === "withInvitationContext" && invitationTitle ? (
          <p className="rounded-full bg-pink-50 px-3 py-1 text-[13px] font-medium text-pink-600">
            {invitationTitle}에 초대받았어요
          </p>
        ) : (
          <p className="text-[14px] text-text-secondary">소셜 계정으로 1초 만에 시작</p>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <SocialButton provider="kakao" loading={state === "kakaoLoading"} onClick={onKakao} />
        <SocialButton provider="naver" loading={state === "naverLoading"} onClick={onNaver} />
        <SocialButton provider="google" loading={state === "googleLoading"} onClick={onGoogle} />

        {errorMessage ? (
          <p
            role="alert"
            className="mt-1 rounded-2xl bg-red-50 px-3 py-2 text-center text-[13px] font-medium text-danger"
          >
            {errorMessage}
          </p>
        ) : null}

        {state === "withInvitationContext" || state === "continueWithoutLogin" ? (
          <Button variant="text" size="md" onClick={onContinueWithoutLogin}>
            로그인 없이 초대장만 보기
          </Button>
        ) : null}

        <p className="mt-2 text-center text-[12px] text-text-tertiary">
          시작 시 <a className="underline">이용약관</a>·<a className="underline">개인정보처리방침</a>에 동의하게 됩니다
        </p>
      </section>

      <ConfirmModal
        contained
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        title="다시 로그인해주세요"
        description="보안을 위해 일정 시간이 지나면 로그아웃돼요."
        confirmLabel="확인"
        onConfirm={() => setSessionModalOpen(false)}
      />

      {mounted && (
        <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} modal={false} noBodyStyles>
          <BottomSheetContent
            contained
            title="로그인이 필요해요"
            description="이 기능을 쓰려면 먼저 로그인해주세요"
          >
            <div className="flex flex-col gap-2 pt-2">
              <SocialButton provider="kakao" onClick={onKakao} />
              <SocialButton provider="naver" onClick={onNaver} />
              <SocialButton provider="google" onClick={onGoogle} />
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </main>
  );
};
