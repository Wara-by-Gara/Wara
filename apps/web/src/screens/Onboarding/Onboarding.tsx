"use client";

import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { ConfirmModal } from "@/components/molecules/Modal";
import { useState } from "react";

export type OnboardingStep =
  | "intro1"
  | "intro2"
  | "intro3"
  | "intro4"
  | "intro5"
  | "skipModal"
  | "permissionNotification"
  | "permissionPhoto"
  | "permissionLocation"
  | "permissionDenied"
  | "completedRedirect";

const SLIDES: { key: OnboardingStep; icon: IconName; title: string; description: string }[] = [
  { key: "intro1", icon: "pixel-heart", title: "Wara에 오신 걸 환영해요", description: "초대장을 더 특별하게,\n모임은 더 따뜻하게" },
  { key: "intro2", icon: "ticket", title: "초대장을 예쁘게 만들어보세요", description: "Y2K 템플릿부터 미니멀까지\n선택할 수 있어요" },
  { key: "intro3", icon: "user-check", title: "참석 여부를 한눈에", description: "RSVP로 친구들의 응답을\n실시간으로 확인해보세요" },
  { key: "intro4", icon: "retro-camera", title: "모임 사진을 함께 모아요", description: "참석자 모두가 사진을 올리고\n앨범으로 추억을 남길 수 있어요" },
  { key: "intro5", icon: "sparkle", title: "이제 시작해볼까요?", description: "첫 초대장을 만들어보세요" },
];

const PERMISSION_GUIDES: Record<
  "permissionNotification" | "permissionPhoto" | "permissionLocation" | "permissionDenied",
  { icon: IconName; title: string; description: string }
> = {
  permissionNotification: {
    icon: "bell",
    title: "알림을 보내드려도 될까요?",
    description: "RSVP 응답이나 모임 안내를 알려드릴게요",
  },
  permissionPhoto: {
    icon: "image",
    title: "사진을 함께 모으려면\n앨범 접근이 필요해요",
    description: "모임 사진을 선택해 Wara 앨범에 올릴 수 있어요",
  },
  permissionLocation: {
    icon: "map-pin",
    title: "장소를 빠르게 찾으려면 위치가 필요해요",
    description: "초대장의 장소를 지도로 보여드릴게요",
  },
  permissionDenied: {
    icon: "lock",
    title: "권한이 거부되었어요",
    description: "설정 > 알림에서 다시 허용할 수 있어요",
  },
};

export interface OnboardingProps {
  step?: OnboardingStep;
  onNext?: () => void;
  onSkip?: () => void;
  onAllow?: () => void;
  onDeny?: () => void;
  onOpenSettings?: () => void;
}

export const Onboarding = ({ step = "intro1", onNext, onSkip, onAllow, onDeny, onOpenSettings }: OnboardingProps) => {
  const [skipModalOpen, setSkipModalOpen] = useState(step === "skipModal");

  if (step === "completedRedirect") {
    return (
      <main className="flex min-h-screen w-full max-w-md mx-auto flex-col items-center justify-center gap-3 bg-background px-6">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <p className="text-[14px] text-text-secondary">홈으로 이동 중...</p>
      </main>
    );
  }

  const isSlide = step.startsWith("intro");
  const isPermission = step.startsWith("permission");
  const slideIndex = SLIDES.findIndex((s) => s.key === step);
  const slide = SLIDES[slideIndex];
  const permission = isPermission ? PERMISSION_GUIDES[step as keyof typeof PERMISSION_GUIDES] : null;
  const current = isSlide ? slide : null;
  const cta = isSlide && slideIndex < SLIDES.length - 1 ? "다음" : "시작하기";

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
      {/* Top skip */}
      {isSlide ? (
        <header className="flex items-center justify-end p-4">
          <button
            type="button"
            onClick={() => setSkipModalOpen(true)}
            className="text-[14px] text-text-tertiary"
          >
            건너뛰기
          </button>
        </header>
      ) : null}

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        {current ? (
          <>
            <div className="inline-flex size-24 items-center justify-center rounded-3xl bg-primary-soft">
              <Icon name={current.icon} size="xl" color="primary" decorative />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[24px] font-extrabold text-text-primary">{current.title}</h1>
              <p className="whitespace-pre-line text-[15px] text-text-secondary">{current.description}</p>
            </div>
          </>
        ) : null}

        {permission ? (
          <>
            <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-yellow-100">
              <Icon name={permission.icon} size="xl" color="primary" decorative />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="whitespace-pre-line text-[20px] font-bold text-text-primary">{permission.title}</h1>
              <p className="text-[14px] text-text-secondary">{permission.description}</p>
            </div>
          </>
        ) : null}
      </section>

      {/* Pagination dots */}
      {isSlide ? (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {SLIDES.map((s, i) => (
            <span
              key={s.key}
              aria-hidden
              className={
                i === slideIndex
                  ? "h-1.5 w-6 rounded-full bg-primary"
                  : "h-1.5 w-1.5 rounded-full bg-gray-300"
              }
            />
          ))}
        </div>
      ) : null}

      {/* Bottom CTA */}
      <footer className="flex flex-col gap-2 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {isPermission ? (
          <>
            <Button variant="primary" size="lg" fullWidth onClick={step === "permissionDenied" ? onOpenSettings : onAllow}>
              {step === "permissionDenied" ? "설정 열기" : "권한 허용하기"}
            </Button>
            <Button variant="text" size="md" onClick={onDeny}>나중에 할게요</Button>
          </>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={onNext}>
            {cta}
          </Button>
        )}
      </footer>

      <ConfirmModal
        contained
        open={skipModalOpen}
        onOpenChange={setSkipModalOpen}
        title="건너뛰시겠어요?"
        description="언제든 다시 볼 수 있어요"
        confirmLabel="건너뛰기"
        cancelLabel="계속 보기"
        onConfirm={() => {
          setSkipModalOpen(false);
          onSkip?.();
        }}
      />
    </main>
  );
};
