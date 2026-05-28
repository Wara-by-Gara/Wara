"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Badge } from "@/components/primitives/Badge";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { MenuItem } from "@/components/molecules/MenuItem";
import { ConfirmModal } from "@/components/molecules/Modal";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { ParticipantSummaryCard } from "@/components/organisms/ParticipantSummaryCard";
import { ParticipantItem } from "@/components/organisms/ParticipantItem";
import { mockInvitation, mockParticipants } from "@/lib/mockData";

export type InvitationDetailHostState =
  | "default"
  | "withManagementSummary"
  | "noParticipants"
  | "moreMenuOpen"
  | "shareSheetOpen"
  | "qrView"
  | "linkManagement"
  | "linkRegenerateModal"
  | "editEntry"
  | "closeInvitationModal"
  | "reopenInvitationModal"
  | "deleteInvitationModal"
  | "duplicateInvitationModal"
  | "makePrivateModal"
  | "sendNoticeEntry"
  | "statsSummary"
  | "rsvpResponseRate"
  | "unrespondedParticipants";

export interface InvitationDetailHostProps {
  state?: InvitationDetailHostState;
  onBack?: () => void;
}

export const InvitationDetailHost = ({ state = "default", onBack }: InvitationDetailHostProps) => {
  const attending = mockParticipants.filter((p) => p.status === "attending").length;
  const maybe = mockParticipants.filter((p) => p.status === "maybe").length;
  const declined = mockParticipants.filter((p) => p.status === "declined").length;
  const noResponse = mockParticipants.filter((p) => p.status === "noResponse").length;

  if (state === "qrView") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="QR 코드" onBack={onBack ?? (() => {})} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6">
          <div className="size-64 rounded-3xl bg-gray-100 grid place-items-center">
            <Icon name="qrcode" size="xl" color="default" decorative className="size-32" />
          </div>
          <p className="text-[14px] text-text-secondary">이 QR로 초대장을 공유할 수 있어요</p>
          <Button variant="outline" size="md">이미지로 저장</Button>
        </main>
      </div>
    );
  }

  if (state === "linkManagement" || state === "linkRegenerateModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대 링크" onBack={onBack ?? (() => {})} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <section className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[13px] text-text-tertiary">초대 링크</p>
            <p className="mt-1 break-all text-[14px] text-text-primary">https://wara.app/i/01HZX</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" fullWidth><Icon name="copy" size="sm" decorative />복사</Button>
              <Button variant="outline" size="sm" fullWidth><Icon name="share" size="sm" decorative />공유</Button>
            </div>
          </section>
          <Button variant="danger" size="md">링크 재생성</Button>
        </main>
        <ConfirmModal contained
          open={state === "linkRegenerateModal"}
          onOpenChange={() => {}}
          title="링크를 재생성할까요?"
          description="이전 링크는 더 이상 작동하지 않아요"
          confirmLabel="재생성"
          confirmVariant="danger"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0"
        variant="transparent"
        onBack={onBack ?? (() => {})}
        rightSlot={
          <>
            <button type="button" aria-label="공유" className="inline-flex size-11 items-center justify-center text-text-secondary">
              <Icon name="share" size="lg" color="currentColor" decorative />
            </button>
            <button type="button" aria-label="더보기" className="inline-flex size-11 items-center justify-center text-text-secondary">
              <Icon name="more-horizontal" size="lg" color="currentColor" decorative />
            </button>
          </>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5">
        <InvitationCover
          variant="image"
          imageUrl={mockInvitation.coverImageUrl}
          ddayLabel={mockInvitation.ddayLabel}
          isHost
        />

        <header className="flex items-center gap-2">
          <Badge variant="host" size="md">호스트</Badge>
          <h1 className="text-[22px] font-extrabold text-text-primary truncate">{mockInvitation.title}</h1>
        </header>

        <ParticipantSummaryCard
          variant="host"
          summary={{
            total: mockParticipants.length,
            attending,
            maybe,
            declined,
            noResponse,
            capacity: mockInvitation.rsvp?.capacity,
          }}
        />

        <InvitationInfoCard variant="datetime" title={mockInvitation.date} chevron />
        <InvitationInfoCard variant="location" title={mockInvitation.location ?? ""} description={mockInvitation.address} chevron />
        <InvitationInfoCard variant="rsvp" title={`${attending}명 참석 · ${maybe}명 미정`} description={`총 ${mockParticipants.length}명 응답`} chevron />

        {state === "withManagementSummary" || state === "statsSummary" || state === "rsvpResponseRate" ? (
          <section className="rounded-3xl border border-border bg-surface p-4">
            <h3 className="text-[14px] font-bold text-text-primary">관리</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[20px] font-extrabold text-primary">{Math.round((attending + maybe + declined) / mockParticipants.length * 100)}%</p>
                <p className="text-[12px] text-text-tertiary">응답률</p>
              </div>
              <div>
                <p className="text-[20px] font-extrabold text-text-primary">{noResponse}</p>
                <p className="text-[12px] text-text-tertiary">미응답</p>
              </div>
              <div>
                <p className="text-[20px] font-extrabold text-text-primary">12</p>
                <p className="text-[12px] text-text-tertiary">조회</p>
              </div>
            </div>
          </section>
        ) : null}

        {state === "noParticipants" ? (
          <section className="rounded-3xl border border-dashed border-border-strong bg-gray-50 p-5 text-center">
            <p className="text-[15px] font-semibold text-text-primary">아직 참석자가 없어요</p>
            <p className="mt-1 text-[13px] text-text-tertiary">링크를 공유해 친구들을 초대해보세요</p>
            <Button variant="primary" size="md" className="mt-3">공유하기</Button>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-[14px] font-bold text-text-primary">최근 응답</h3>
            <div className="divide-y divide-border">
              {(state === "unrespondedParticipants"
                ? mockParticipants.filter((p) => p.status === "noResponse")
                : mockParticipants
              )
                .slice(0, 4)
                .map((p) => (
                  <ParticipantItem
                    key={p.id}
                    name={p.name}
                    avatarUrl={p.avatarUrl}
                    status={p.status}
                    isHost={p.isHost}
                    companionCount={p.companionCount}
                  />
                ))}
            </div>
          </section>
        )}

        {state === "sendNoticeEntry" ? (
          <Button variant="outline" size="md" fullWidth>
            <Icon name="megaphone" size="sm" decorative />
            공지 작성
          </Button>
        ) : null}
      </main>

      <BottomSheet open={state === "moreMenuOpen"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="초대장 관리">
          <div className="flex flex-col">
            <MenuItem leftIcon="edit">수정</MenuItem>
            <MenuItem leftIcon="copy">복제</MenuItem>
            <MenuItem leftIcon="eye-off">비공개로 전환</MenuItem>
            <MenuItem leftIcon="x-circle">초대 마감</MenuItem>
            <MenuItem leftIcon="trash" variant="danger">삭제</MenuItem>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={state === "shareSheetOpen"} onOpenChange={() => {}}>
        <BottomSheetContent contained title="공유하기">
          <div className="flex flex-col gap-1">
            <ShareOptionItem icon="link" title="링크 복사" iconBg="bg-gray-100" />
            <ShareOptionItem icon="message-circle" title="카카오톡 공유" iconBg="bg-yellow-300" iconColor="text-gray-900" />
            <ShareOptionItem icon="qrcode" title="QR 코드" iconBg="bg-sky-100" iconColor="text-sky-500" />
            <ShareOptionItem icon="download" title="이미지로 저장" iconBg="bg-pink-100" iconColor="text-pink-600" />
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <ConfirmModal contained open={state === "closeInvitationModal"} onOpenChange={() => {}} title="초대를 마감할까요?" description="새로운 응답을 받을 수 없어요" confirmLabel="마감" confirmVariant="danger" />
      <ConfirmModal contained open={state === "reopenInvitationModal"} onOpenChange={() => {}} title="초대를 다시 열까요?" confirmLabel="다시 열기" />
      <ConfirmModal contained open={state === "deleteInvitationModal"} onOpenChange={() => {}} title="초대장을 삭제할까요?" description="모든 응답과 댓글이 사라져요" confirmLabel="삭제" confirmVariant="danger" />
      <ConfirmModal contained open={state === "duplicateInvitationModal"} onOpenChange={() => {}} title="이 초대장을 복제할까요?" confirmLabel="복제" />
      <ConfirmModal contained open={state === "makePrivateModal"} onOpenChange={() => {}} title="비공개로 바꿀까요?" description="링크를 가진 사람만 볼 수 있어요" confirmLabel="비공개" />
    </div>
  );
};
