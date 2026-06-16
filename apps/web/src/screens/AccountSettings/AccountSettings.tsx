"use client";

import {
  Icon,
  Button,
  Radio,
  RadioGroup,
  Textarea,
  Input,
  MenuItem,
  TopAppBar,
  ConfirmDialog,
} from "@wara/ui";
import { Icon as BrandIcon } from "@/components/icons";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { useState } from "react";

export type AccountScreen =
  | "connectedSocial"
  | "connectAdditional"
  | "disconnectModal"
  | "logoutComplete"
  | "withdrawGuide"
  | "withdrawReason"
  | "withdrawFinalConfirm"
  | "withdrawComplete";

export type WithdrawalReasonKey =
  | "rarely"
  | "alternative"
  | "missing"
  | "privacy"
  | "etc";

const WITHDRAW_CONFIRM_PHRASE = "탈퇴";

export interface AccountSettingsProps {
  screen?: AccountScreen;
  onBack?: () => void;
  onLogout?: () => void;
  onLoginAgain?: () => void;
  onWithdrawStart?: () => void;
  onWithdrawContinue?: () => void;
  onWithdrawCancel?: () => void;
  onWithdrawConfirm?: () => void;
  onWithdrawComplete?: () => void;
  isWithdrawing?: boolean;
  connectedProviders?: string[];
  onDisconnectRequest?: (provider: string) => void;
  onDisconnectConfirm?: () => void;
  isDisconnecting?: boolean;
  onLinkRequest?: (provider: string) => void;
  isLinking?: boolean;
  linkingProvider?: string | null;
  onLastConnectedClick?: () => void;
  // 탈퇴 사유 — Container에서 끌어올린 state를 props로 받는다
  withdrawReason?: WithdrawalReasonKey;
  withdrawDetail?: string;
  onWithdrawReasonChange?: (reason: WithdrawalReasonKey) => void;
  onWithdrawDetailChange?: (detail: string) => void;
}

export const AccountSettings = ({ screen = "connectedSocial", onBack, onLogout, onLoginAgain, onWithdrawStart, onWithdrawContinue, onWithdrawCancel, onWithdrawConfirm, onWithdrawComplete, isWithdrawing, connectedProviders, onDisconnectRequest, onDisconnectConfirm, isDisconnecting, onLinkRequest, isLinking, linkingProvider, onLastConnectedClick, withdrawReason, withdrawDetail, onWithdrawReasonChange, onWithdrawDetailChange }: AccountSettingsProps) => {
  const [modalOpen, setModalOpen] = useState(
    screen === "disconnectModal" || screen === "withdrawFinalConfirm",
  );

  if (screen === "connectedSocial" || screen === "connectAdditional" || screen === "disconnectModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="계정 관리" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
        <section className="py-2">
          <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">연결된 소셜 계정</h2>
          <div className="divide-y divide-border bg-surface">
            {(["kakao", "naver", "google"] as const).map((provider) => {
              const isConnected = connectedProviders?.includes(provider);
              const isLastConnected = isConnected && (connectedProviders?.length ?? 0) === 1;
              const isThisLinking = isLinking && linkingProvider === provider;
              const label = { kakao: "카카오", naver: "네이버", google: "Google" }[provider];
              const icon = { kakao: "kakao-logo", naver: "naver-logo", google: "google-logo" }[provider] as "kakao-logo" | "naver-logo" | "google-logo";
              const handleClick = isConnected
                ? (isLastConnected ? () => onLastConnectedClick?.() : () => onDisconnectRequest?.(provider))
                : (isLinking ? undefined : () => onLinkRequest?.(provider));
              const rightText = isThisLinking
                ? "연결 중..."
                : isConnected
                  ? "연결됨"
                  : "연결하기";
              return (
                <MenuItem
                  key={provider}
                  leftSlot={
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                      <BrandIcon name={icon} size="sm" color="default" decorative />
                    </span>
                  }
                  onClick={handleClick}
                  rightSlot={<span className="text-[13px] text-text-tertiary">{rightText}</span>}
                >
                  {label}
                </MenuItem>
              );
            })}
          </div>
        </section>
        <section className="py-2">
          <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">계정</h2>
          <div className="divide-y divide-border bg-surface">
            <MenuItem leftIcon="log-out" variant="danger" onClick={() => setModalOpen(true)}>로그아웃</MenuItem>
            <MenuItem leftIcon="trash" variant="danger" onClick={onWithdrawStart}>회원 탈퇴</MenuItem>
          </div>
        </section>
        </main>

        <ConfirmDialog
          open={screen === "disconnectModal" ? true : modalOpen}
          onOpenChange={(open) => { if (!open) { if (screen === "disconnectModal") onBack?.(); else setModalOpen(false); } }}
          title={screen === "disconnectModal" ? "연결 해제할까요?" : "로그아웃 할까요?"}
          description={
            screen === "disconnectModal"
              ? "다음 로그인부터 이 계정을 사용할 수 없어요"
              : "다시 들어오려면 다시 로그인해야 해요"
          }
          confirmLabel={screen === "disconnectModal" ? "해제" : "로그아웃"}
          tone="danger"
          onConfirm={() => (screen === "disconnectModal" ? onDisconnectConfirm : onLogout)?.()}
          loading={screen === "disconnectModal" ? isDisconnecting : undefined}
        />
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
          <Button variant="primary" size="md" onClick={onLoginAgain}>다시 로그인하기</Button>
        </main>
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
            <li>• 탈퇴 후 가입했던 데이터는 복구할 수 없어요</li>
          </ul>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "계속 진행", variant: "primary", onClick: onWithdrawContinue }} secondary={{ label: "취소", onClick: onWithdrawCancel }} />
      </div>
      </div>
    );
  }

  if (screen === "withdrawReason") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="떠나시는 이유를 알려주세요" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <RadioGroup
            value={withdrawReason ?? "rarely"}
            onValueChange={(v) => onWithdrawReasonChange?.(v as WithdrawalReasonKey)}
          >
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
          <Textarea
            className="mt-4"
            placeholder="더 들려주실 이야기가 있다면…"
            rows={4}
            maxLength={500}
            value={withdrawDetail ?? ""}
            onChange={(e) => onWithdrawDetailChange?.(e.target.value)}
          />
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "계속", variant: "danger", onClick: onWithdrawContinue }} secondary={{ label: "취소", onClick: onWithdrawCancel }} />
      </div>
      </div>
    );
  }

  if (screen === "withdrawFinalConfirm") {
    return (
      <WithdrawFinalConfirm
        onBack={onBack}
        onWithdrawCancel={onWithdrawCancel}
        onWithdrawConfirm={onWithdrawConfirm}
        isWithdrawing={isWithdrawing}
      />
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
        <Button variant="secondary" size="md" onClick={onWithdrawComplete}>홈으로</Button>
      </main>
    </div>
  );
};

// 최종 탈퇴 확인 — "탈퇴" 문구 직접 입력 게이트로 오클릭 방지.
interface WithdrawFinalConfirmProps {
  onBack?: () => void;
  onWithdrawCancel?: () => void;
  onWithdrawConfirm?: () => void;
  isWithdrawing?: boolean;
}

function WithdrawFinalConfirm({ onBack, onWithdrawCancel, onWithdrawConfirm, isWithdrawing }: WithdrawFinalConfirmProps) {
  const [phrase, setPhrase] = useState("");
  const canConfirm = phrase.trim() === WITHDRAW_CONFIRM_PHRASE;

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="회원 탈퇴" onBack={onBack} />
      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
        <h1 className="text-[20px] font-bold text-text-primary">정말 탈퇴할까요?</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          탈퇴하면 모든 데이터가 즉시 삭제되고 복구할 수 없어요.
          확인을 위해 아래에 <span className="font-bold">‘{WITHDRAW_CONFIRM_PHRASE}’</span> 을(를) 입력해주세요.
        </p>
        <Input
          className="mt-6"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={WITHDRAW_CONFIRM_PHRASE}
          autoFocus
          disabled={isWithdrawing}
        />
      </main>
      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: isWithdrawing ? "처리 중..." : "탈퇴",
            variant: "danger",
            onClick: onWithdrawConfirm,
            disabled: !canConfirm || isWithdrawing,
          }}
          secondary={{ label: "취소", onClick: onWithdrawCancel }}
        />
      </div>
    </div>
  );
}
