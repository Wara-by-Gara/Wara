"use client";

import {
  Icon,
  Avatar,
  Button,
  Checkbox,
  Input,
  FormField,
  TopAppBar,
} from "@wara/ui";
import { useState } from "react";

export type SignupStep =
  | "termsAgreement"
  | "termsDetail"
  | "privacyDetail"
  | "marketingAgreement"
  | "nicknameInput"
  | "nicknameError"
  | "profileImageSelect"
  | "profileImageCrop"
  | "complete"
  | "failed";

export interface SignupProps {
  step?: SignupStep;
  onNext?: () => void;
  onBack?: () => void;
}

export const Signup = ({ step = "termsAgreement", onNext, onBack }: SignupProps) => {
  const [checks, setChecks] = useState({ all: false, terms: false, privacy: false, marketing: false });
  const toggleAll = (v: boolean) => setChecks({ all: v, terms: v, privacy: v, marketing: v });

  const renderBody = () => {
    if (step === "termsAgreement") {
      return (
        <section className="flex flex-col gap-4">
          <h1 className="text-[22px] font-extrabold text-text-primary">서비스 약관에 동의해주세요</h1>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-3 rounded-md border border-border-strong px-4 py-3.5">
              <Checkbox checked={checks.all} onCheckedChange={(v) => toggleAll(!!v)} />
              <span className="text-[15px] font-semibold text-text-primary">모두 동의</span>
            </label>
            <div className="mt-2 flex flex-col">
              {[
                { key: "terms", label: "[필수] 이용약관" },
                { key: "privacy", label: "[필수] 개인정보처리방침" },
                { key: "marketing", label: "[선택] 마케팅 정보 수신" },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between px-2 py-3">
                  <span className="flex items-center gap-3">
                    <Checkbox
                      checked={checks[item.key as keyof typeof checks]}
                      onCheckedChange={(v) => setChecks({ ...checks, [item.key]: !!v })}
                    />
                    <span className="text-[14px] text-text-secondary">{item.label}</span>
                  </span>
                  <button type="button" className="text-[13px] text-text-tertiary underline">보기</button>
                </label>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (step === "termsDetail" || step === "privacyDetail" || step === "marketingAgreement") {
      const title = step === "termsDetail" ? "이용약관" : step === "privacyDetail" ? "개인정보처리방침" : "마케팅 정보 수신";
      return (
        <section className="flex flex-col gap-3">
          <h1 className="text-[22px] font-extrabold text-text-primary">{title}</h1>
          <p className="rounded-md bg-gray-50 p-4 text-[13px] leading-relaxed text-text-secondary">
            (약관 본문 발췌) 본 약관은 Wara(이하 &ldquo;회사&rdquo;)가 제공하는 서비스를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다…
          </p>
        </section>
      );
    }

    if (step === "nicknameInput" || step === "nicknameError") {
      return (
        <section className="flex flex-col gap-4">
          <h1 className="text-[22px] font-extrabold text-text-primary">어떻게 불러드릴까요?</h1>
          <FormField
            label="닉네임"
            required
            error={step === "nicknameError" ? "이미 사용 중인 닉네임이에요" : undefined}
            helper="20자 이내 한글·영문·숫자"
            counter={{ current: 3, max: 20 }}
          >
            <Input defaultValue="와라" placeholder="닉네임" />
          </FormField>
        </section>
      );
    }

    if (step === "profileImageSelect" || step === "profileImageCrop") {
      return (
        <section className="flex flex-col items-center gap-5">
          <h1 className="text-[22px] font-extrabold text-text-primary text-center">프로필 이미지를 골라주세요</h1>
          {step === "profileImageSelect" ? (
            <button
              type="button"
              aria-label="프로필 이미지 선택"
              className="relative inline-flex size-36 items-center justify-center rounded-full bg-gray-100"
            >
              <Avatar size="xl" name="와" className="size-36 text-3xl" />
              <span className="absolute right-0 bottom-0 inline-flex size-9 items-center justify-center rounded-full bg-primary text-text-inverse">
                <Icon name="camera" size="sm" color="currentColor" decorative />
              </span>
            </button>
          ) : (
            <div className="relative size-64 overflow-hidden rounded-lg bg-gray-900">
              <div className="absolute inset-4 rounded-full border-4 border-dashed border-white/60" />
              <div className="absolute inset-x-4 bottom-4 text-center text-[12px] text-white/80">
                원하는 영역을 맞춰주세요
              </div>
            </div>
          )}
          <p className="text-[13px] text-text-tertiary">건너뛰면 기본 이미지가 사용돼요</p>
        </section>
      );
    }

    if (step === "complete") {
      return (
        <section className="flex flex-col items-center gap-4 text-center">
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">가입이 완료됐어요!</h1>
          <p className="text-[14px] text-text-secondary">와라에서 첫 모임을 만들어보세요</p>
        </section>
      );
    }

    return (
      <section className="flex flex-col items-center gap-3 text-center">
        <Icon name="alert-triangle" size="xl" color="danger" decorative />
        <h1 className="text-[20px] font-bold text-text-primary">가입에 실패했어요</h1>
        <p className="text-[13px] text-text-secondary">잠시 후 다시 시도해주세요</p>
      </section>
    );
  };

  const ctaLabel =
    step === "complete" ? "홈으로" :
    step === "failed" ? "다시 시도" :
    step === "profileImageCrop" ? "맞췄어요" :
    step === "profileImageSelect" ? "건너뛰기" :
    "다음";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <TopAppBar title="회원가입" onBack={step === "complete" ? undefined : onBack} />
      <main className={step === "complete" || step === "failed" ? "flex flex-1 items-center justify-center px-page py-6" : "flex-1 px-page py-6"}>{renderBody()}</main>
      <footer className="px-page pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>{ctaLabel}</Button>
      </footer>
    </div>
  );
};
