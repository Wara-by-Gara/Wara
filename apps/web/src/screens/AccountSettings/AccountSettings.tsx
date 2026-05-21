"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Radio, RadioGroup } from "@/components/primitives/Radio";
import { Textarea } from "@/components/primitives/Textarea";
import { MenuItem } from "@/components/molecules/MenuItem";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { ConfirmModal } from "@/components/molecules/Modal";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { useState } from "react";

export type AccountScreen =
  | "connectedSocial"
  | "connectAdditional"
  | "disconnectModal"
  | "logoutModal"
  | "logoutComplete"
  | "withdrawGuide"
  | "withdrawReason"
  | "withdrawFinalConfirm"
  | "withdrawComplete";

export interface AccountSettingsProps {
  screen?: AccountScreen;
  onBack?: () => void;
}

export const AccountSettings = ({ screen = "connectedSocial", onBack }: AccountSettingsProps) => {
  const [modalOpen, setModalOpen] = useState(
    screen === "disconnectModal" || screen === "logoutModal" || screen === "withdrawFinalConfirm",
  );

  if (screen === "connectedSocial" || screen === "connectAdditional" || screen === "disconnectModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="계정 관리" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
        <section className="py-2">
          <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">연결된 소셜 계정</h2>
          <div className="divide-y divide-border bg-surface">
            <MenuItem leftIcon="kakao-logo" rightSlot={<span className="text-[13px] text-text-tertiary">연결됨</span>}>카카오</MenuItem>
            <MenuItem leftIcon="naver-logo" rightSlot={
              screen === "connectAdditional" ? <Button size="sm" variant="outline">연결</Button> : <Button size="sm" variant="text">연결</Button>
            }>네이버</MenuItem>
            <MenuItem leftIcon="apple-logo" rightSlot={<Button size="sm" variant="text">연결</Button>}>Apple</MenuItem>
          </div>
        </section>
        <section className="py-2">
          <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">계정</h2>
          <div className="divide-y divide-border bg-surface">
            <MenuItem leftIcon="log-out" variant="danger" onClick={() => setModalOpen(true)}>로그아웃</MenuItem>
            <MenuItem leftIcon="trash" variant="danger">회원 탈퇴</MenuItem>
          </div>
        </section>
        </main>

        <ConfirmModal contained
          open={screen === "disconnectModal" ? true : modalOpen}
          onOpenChange={setModalOpen}
          title={screen === "disconnectModal" ? "연결 해제할까요?" : "로그아웃 할까요?"}
          description={
            screen === "disconnectModal"
              ? "다음 로그인부터 이 계정을 사용할 수 없어요"
              : "다시 들어오려면 다시 로그인해야 해요"
          }
          confirmLabel={screen === "disconnectModal" ? "해제" : "로그아웃"}
          confirmVariant="danger"
        />
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  if (screen === "logoutModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="계정 관리" onBack={onBack} />
        <ConfirmModal contained
          open
          onOpenChange={() => {}}
          title="로그아웃 할까요?"
          description="다시 들어오려면 다시 로그인해야 해요"
          confirmLabel="로그아웃"
          confirmVariant="danger"
        />
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  if (screen === "logoutComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="계정 관리" />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <Icon name="log-out" size="xl" color="primary" decorative />
          <p className="text-[18px] font-bold text-text-primary">로그아웃 됐어요</p>
          <Button variant="primary" size="md">다시 로그인하기</Button>
        </main>
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  if (screen === "withdrawGuide") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="회원 탈퇴 안내" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <h1 className="text-[20px] font-bold text-text-primary">탈퇴 전 확인해주세요</h1>
          <ul className="mt-4 flex flex-col gap-3 text-[14px] text-text-secondary">
            <li>• 내가 만든 초대장과 참석자 데이터가 모두 삭제돼요</li>
            <li>• 함께 올린 사진·댓글이 사라져요</li>
            <li>• 30일 동안 같은 계정으로 다시 가입할 수 없어요</li>
          </ul>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "계속 진행", variant: "danger" }} secondary={{ label: "취소" }} />
      </div>
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  if (screen === "withdrawReason") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="떠나시는 이유를 알려주세요" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <RadioGroup defaultValue="rarely">
            {[
              { value: "rarely", label: "거의 사용하지 않아서" },
              { value: "alternative", label: "다른 서비스를 사용해요" },
              { value: "missing", label: "원하는 기능이 없어요" },
              { value: "privacy", label: "개인정보가 걱정돼요" },
              { value: "etc", label: "기타" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                <Radio value={opt.value} />
                <span className="text-[15px] text-text-primary">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
          <Textarea className="mt-4" placeholder="더 들려주실 이야기가 있다면…" rows={4} />
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "계속", variant: "danger" }} secondary={{ label: "취소" }} />
      </div>
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  if (screen === "withdrawFinalConfirm") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="회원 탈퇴" onBack={onBack} />
        <ConfirmModal contained
          open
          onOpenChange={() => {}}
          title="정말 탈퇴할까요?"
          description="복구할 수 없어요"
          confirmLabel="탈퇴"
          confirmVariant="danger"
        />
      <MainBottomNav activeKey="me" />
      </div>
    );
  }

  // withdrawComplete
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="회원 탈퇴" />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 text-center">
        <Icon name="user-x" size="xl" color="inactive" decorative />
        <p className="text-[18px] font-bold text-text-primary">탈퇴가 완료됐어요</p>
        <p className="text-[14px] text-text-secondary">언젠가 다시 만나길 바라요</p>
        <Button variant="outline" size="md">홈으로</Button>
      </main>
      <MainBottomNav activeKey="me" />
    </div>
  );
};
