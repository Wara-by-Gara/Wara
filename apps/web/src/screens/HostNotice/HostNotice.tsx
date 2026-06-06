"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { Textarea } from "@/components/primitives/Textarea";
import { TextInput } from "@/components/primitives/TextInput";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { ConfirmModal } from "@/components/molecules/Modal";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { EmptyState } from "@/components/organisms/EmptyState";

export type HostNoticeScreen =
  | "list"
  | "empty"
  | "detail"
  | "createEmpty"
  | "createFilled"
  | "sendConfirm"
  | "sending"
  | "sendComplete"
  | "edit"
  | "deleteModal"
  | "guestView";

export interface HostNoticeProps {
  screen?: HostNoticeScreen;
  onBack?: () => void;
}

const SAMPLE_LIST = [
  { id: "1", title: "주차장 안내", body: "건물 지하 1층 무료 주차 가능합니다.", sentAt: "1시간 전" },
  { id: "2", title: "드레스 코드", body: "편안한 분홍 계열로 와주세요!", sentAt: "어제" },
];

export const HostNotice = ({ screen = "list", onBack }: HostNoticeProps) => {
  if (screen === "list") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar title="공지" onBack={onBack} rightSlot={
          <button type="button" aria-label="공지 작성" className="shrink-0 inline-flex size-11 items-center justify-center text-primary">
            <Icon name="plus" size="lg" color="currentColor" decorative />
          </button>
        } />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-4">
          <div className="flex flex-col gap-2">
            {SAMPLE_LIST.map((n) => (
              <article key={n.id} className="rounded-md border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-text-primary">{n.title}</h3>
                  <span className="text-[12px] text-text-tertiary">{n.sentAt}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-text-secondary">{n.body}</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (screen === "empty") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="공지" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState
          icon="megaphone"
          title="아직 공지가 없어요"
          description="참석자에게 첫 공지를 보내보세요"
          action={<Button>공지 작성</Button>}
        />
        </main>
      </div>
    );
  }

  if (screen === "detail") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar title="공지" onBack={onBack} rightSlot={
          <button type="button" aria-label="더보기" className="shrink-0 inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="more-horizontal" size="lg" color="currentColor" decorative />
          </button>
        } />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-6">
          <h1 className="text-[20px] font-bold text-text-primary">주차장 안내</h1>
          <p className="mt-1 text-[13px] text-text-tertiary">1시간 전 · 호스트 김와라</p>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-text-primary">
            건물 지하 1층 무료 주차 가능합니다.{"\n"}만차일 경우 인근 공영주차장을 이용해주세요.
          </p>
        </main>
      </div>
    );
  }

  if (screen === "createEmpty" || screen === "createFilled" || screen === "edit") {
    const filled = screen !== "createEmpty";
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={screen === "edit" ? "공지 수정" : "공지 작성"} onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-4">
          <div className="flex flex-col gap-4">
            <FormField label="제목" required>
              <TextInput defaultValue={filled ? "주차장 안내" : ""} placeholder="공지 제목" />
            </FormField>
            <FormField label="내용" required counter={{ current: filled ? 24 : 0, max: 500 }}>
              <Textarea rows={6} defaultValue={filled ? "건물 지하 1층 무료 주차 가능합니다." : ""} placeholder="참석자에게 전할 내용을 적어주세요" />
            </FormField>
          </div>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "보내기", disabled: !filled }} />
      </div>
      </div>
    );
  }

  if (screen === "sendConfirm") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="공지 작성" onBack={onBack} />
        <ConfirmModal contained
          open
          onOpenChange={() => {}}
          title="공지를 보낼까요?"
          description="참석자 12명에게 푸시 알림이 발송됩니다"
          confirmLabel="보내기"
        />
      </div>
    );
  }

  if (screen === "sending") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="공지" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-[14px] text-text-secondary">보내는 중...</p>
        </main>
      </div>
    );
  }

  if (screen === "sendComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="공지" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-page text-center">
          <Icon name="badge-check" size="xl" color="success" decorative />
          <p className="text-[18px] font-bold text-text-primary">공지를 보냈어요</p>
          <p className="text-[14px] text-text-secondary">12명에게 알림이 도착했어요</p>
          <Button variant="outline" size="md">목록으로</Button>
        </main>
      </div>
    );
  }

  if (screen === "deleteModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="공지" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <ConfirmModal contained
            open
            onOpenChange={() => {}}
            title="공지를 삭제할까요?"
            description="참석자에게 보낸 알림은 그대로 남아요"
            confirmLabel="삭제"
            confirmVariant="danger"
          />
        </main>
      </div>
    );
  }

  // guestView
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="공지" onBack={onBack} />
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-page py-4">
        {SAMPLE_LIST.map((n) => (
          <article key={n.id} className="rounded-md border border-border bg-surface p-4">
            <h3 className="text-[15px] font-bold text-text-primary">{n.title}</h3>
            <p className="mt-1 text-[13px] text-text-secondary">{n.body}</p>
            <p className="mt-2 text-[12px] text-text-tertiary">{n.sentAt}</p>
          </article>
        ))}
      </main>
    </div>
  );
};
