"use client";

import { Icon } from "@/components/icons";
import { Chip } from "@/components/primitives/Chip";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { DateTimeSelector } from "@/components/molecules/DateTimeSelector";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import { ConfirmModal } from "@/components/molecules/Modal";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { mockInvitation } from "@/lib/mockData";

export type EditStep =
  | "basicInfo"
  | "coverImage"
  | "dateTime"
  | "location"
  | "rsvpSettings"
  | "privacySettings"
  | "design"
  | "questions"
  | "preview"
  | "unsavedChangesModal"
  | "saveLoading"
  | "saveComplete"
  | "saveFailed"
  | "dateChangeWarningModal"
  | "locationChangeNotifyModal"
  | "closedInvitationEditLimited";

export interface InvitationEditProps {
  step?: EditStep;
  onBack?: () => void;
}

const STEPS: EditStep[] = ["basicInfo", "coverImage", "dateTime", "location", "rsvpSettings", "privacySettings", "design", "questions", "preview"];
const STEP_LABELS: Partial<Record<EditStep, string>> = {
  basicInfo: "기본 정보",
  coverImage: "대표 이미지",
  dateTime: "날짜·시간",
  location: "장소",
  rsvpSettings: "RSVP",
  privacySettings: "공개",
  design: "디자인",
  questions: "추가 질문",
  preview: "미리보기",
};

export const InvitationEdit = ({ step = "basicInfo", onBack }: InvitationEditProps) => {
  if (step === "saveLoading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 수정" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-[14px] text-text-secondary">저장 중...</p>
        </main>
        <div className="mt-auto shrink-0">
        </div>
      </div>
    );
  }

  if (step === "saveComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 수정" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <Icon name="badge-check" size="xl" color="success" decorative />
          <p className="text-[18px] font-bold text-text-primary">변경 사항이 저장됐어요</p>
        </main>
        <div className="mt-auto shrink-0">
        </div>
      </div>
    );
  }

  if (step === "saveFailed") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 수정" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-page text-center">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text-primary">저장에 실패했어요</p>
          <Button variant="outline">다시 시도</Button>
        </main>
        <div className="mt-auto shrink-0">
        </div>
      </div>
    );
  }

  const renderBody = () => {
    switch (step) {
      case "basicInfo":
        return (
          <>
            <FormField label="대표 이미지">
              <InvitationCover variant="image" imageUrl={mockInvitation.coverImageUrl} />
              <Button variant="outline" className="mt-3" fullWidth>이미지 변경</Button>
            </FormField>
            <FormField label="제목" required><TextInput defaultValue={mockInvitation.title} /></FormField>
            <FormField label="설명"><Textarea defaultValue={mockInvitation.description} rows={4} /></FormField>
          </>
        );
      case "coverImage":
        return (
          <FormField label="대표 이미지">
            <InvitationCover variant="image" imageUrl={mockInvitation.coverImageUrl} />
            <Button variant="outline" className="mt-3" fullWidth>이미지 변경</Button>
          </FormField>
        );
      case "dateTime":
        return <DateTimeSelector mode="date" label="모임 날짜" value="2026-05-19" />;
      case "location":
        return <LocationSelector mode="selected" selected={{ name: mockInvitation.location ?? "", address: mockInvitation.address ?? "" }} />;
      case "rsvpSettings":
        return <p className="text-[14px] text-text-secondary">RSVP 사용 · 정원 15 · 동반인 허용</p>;
      case "privacySettings":
        return <p className="text-[14px] text-text-secondary">공개 · 참석자 명단 공개 · 댓글 허용</p>;
      case "design":
        return <p className="text-[14px] text-text-secondary">Clean Modern 템플릿</p>;
      case "questions":
        return (
          <div className="flex flex-col gap-2">
            <p className="text-[14px] text-text-secondary">현재 2개</p>
            <Button variant="outline" size="md">질문 추가</Button>
          </div>
        );
      case "preview":
      default:
        return <InvitationCover variant="image" imageUrl={mockInvitation.coverImageUrl} />;
    }
  };

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="초대장 수정" onBack={onBack} />
      <nav
        className="shrink-0 overflow-x-auto overscroll-x-contain px-page py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="수정 단계"
      >
        <div className="flex w-max flex-nowrap gap-1.5">
          {STEPS.map((s) => (
            <Chip
              key={s}
              variant="filter"
              selected={s === step}
              className="shrink-0 whitespace-nowrap"
            >
              {STEP_LABELS[s]}
            </Chip>
          ))}
        </div>
      </nav>
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page py-4">
        {renderBody()}
      </main>

      {step === "closedInvitationEditLimited" ? (
        <p className="shrink-0 px-page pb-2 text-center text-[13px] text-text-tertiary">
          마감된 초대장은 일부만 수정할 수 있어요
        </p>
      ) : null}

      <div className="relative z-10 mt-auto shrink-0">
        <StickyCTA primary={{ label: "저장" }} secondary={{ label: "취소" }} />
      </div>

      <ConfirmModal contained open={step === "unsavedChangesModal"} onOpenChange={() => {}} title="저장하지 않고 나갈까요?" description="변경 내용이 사라져요" confirmLabel="나가기" confirmVariant="danger" />
      <ConfirmModal contained open={step === "dateChangeWarningModal"} onOpenChange={() => {}} title="날짜를 바꾸면 참석자에게 알림이 가요" description="변경 사실을 알릴까요?" confirmLabel="변경" />
      <ConfirmModal contained open={step === "locationChangeNotifyModal"} onOpenChange={() => {}} title="장소가 바뀌었어요" description="참석자에게 알림을 보낼까요?" confirmLabel="알림 보내기" />
    </div>
  );
};
