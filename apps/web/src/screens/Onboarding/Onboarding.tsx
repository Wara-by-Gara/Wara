"use client";

import { Icon, type IconName, Button, ConfirmDialog } from "@wara/ui";
import { useState } from "react";

export type OnboardingStep =
  | "permissionNotification"
  | "permissionPhoto"
  | "permissionLocation"
  | "permissionDenied"
  | "completedRedirect";

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
    title: "장소를 빠르게 찾으려면\n위치가 필요해요",
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
  onAllow?: () => void;
  onDeny?: () => void;
  onSkip?: () => void;
  onOpenSettings?: () => void;
}

export const Onboarding = ({
  step = "permissionNotification",
  onAllow,
  onDeny,
  onSkip,
  onOpenSettings,
}: OnboardingProps) => {
  const [skipModalOpen, setSkipModalOpen] = useState(false);

  if (step === "completedRedirect") {
    return (
      <main className="flex min-h-screen w-full max-w-md mx-auto flex-col items-center justify-center gap-3 bg-background px-page">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <p className="text-[14px] text-text-muted">홈으로 이동 중...</p>
      </main>
    );
  }

  const permission = PERMISSION_GUIDES[step as keyof typeof PERMISSION_GUIDES];

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-end p-4">
        <button
          type="button"
          onClick={() => setSkipModalOpen(true)}
          className="text-[14px] text-text-disabled"
        >
          Skip
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="inline-flex size-20 items-center justify-center rounded-lg bg-yellow-100">
          <Icon name={permission.icon} size="xl" color="primary" decorative />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="whitespace-pre-line text-[20px] font-bold text-text">
            {permission.title}
          </h1>
          <p className="text-[14px] text-text-muted">{permission.description}</p>
        </div>
      </section>

      <footer className="flex flex-col gap-2 px-page pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={step === "permissionDenied" ? onOpenSettings : onAllow}
        >
          {step === "permissionDenied" ? "설정 열기" : "권한 허용하기"}
        </Button>
        <Button variant="text" size="md" onClick={onDeny}>
          나중에 할게요
        </Button>
      </footer>

      <ConfirmDialog
        open={skipModalOpen}
        onOpenChange={setSkipModalOpen}
        title="건너뛰시겠어요?"
        description="언제든 설정에서 다시 허용할 수 있어요"
        confirmLabel="Skip"
        cancelLabel="계속하기"
        onConfirm={() => {
          setSkipModalOpen(false);
          onSkip?.();
        }}
      />
    </main>
  );
};
