"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { ConfirmModal } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { useState } from "react";

export type LoginState =
  | "default"
  | "withInvitationContext"
  | "kakaoLoading"
  | "naverLoading"
  | "appleLoading"
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
  onApple?: () => void;
  onContinueWithoutLogin?: () => void;
}

const SocialButton = ({
  provider,
  loading,
  onClick,
}: {
  provider: "kakao" | "naver" | "apple";
  loading?: boolean;
  onClick?: () => void;
}) => {
  const label = provider === "kakao" ? "카카오로 시작하기" : provider === "naver" ? "네이버로 시작하기" : "Apple로 시작하기";
  const bg = provider === "kakao" ? "bg-[#FEE500] text-[#181600]" : provider === "naver" ? "bg-[#03C75A] text-white" : "bg-black text-white";
  const iconName =
    provider === "apple"
      ? "apple-logo-white"
      : ((provider + "-logo") as "kakao-logo" | "naver-logo");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-[18px] font-bold text-[16px] transition-opacity disabled:opacity-60 ${bg}`}
    >
      {loading ? (
        <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        <Icon name={iconName} size="md" decorative />
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
  onApple,
  onContinueWithoutLogin,
}: LoginProps) => {
  const [sessionModalOpen, setSessionModalOpen] = useState(state === "sessionExpiredModal");
  const [loginSheetOpen, setLoginSheetOpen] = useState(state === "loginRequiredBottomSheet");

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
        <SocialButton provider="apple" loading={state === "appleLoading"} onClick={onApple} />

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

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} modal={false} noBodyStyles>
        <BottomSheetContent
          contained
          title="로그인이 필요해요"
          description="이 기능을 쓰려면 먼저 로그인해주세요"
        >
          <div className="flex flex-col gap-2 pt-2">
            <SocialButton provider="kakao" onClick={onKakao} />
            <SocialButton provider="naver" onClick={onNaver} />
            <SocialButton provider="apple" onClick={onApple} />
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </main>
  );
};
