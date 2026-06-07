"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Radio, RadioGroup } from "@/components/primitives/Radio";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { RSVPButtonGroup, type RSVPValue } from "@/components/molecules/RSVPButtonGroup";
import { ConfirmModal } from "@/components/molecules/Modal";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { mockInvitation, type MockInvitation } from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";
import { useState } from "react";

export type RSVPPageState =
  | "entry"
  | "invitationSummary"
  | "selectStatus"
  | "attendingSelected"
  | "maybeSelected"
  | "declineSelected"
  | "nameInput"
  | "companionCount"
  | "requestMessage"
  | "additionalQuestions"
  | "requiredQuestionError"
  | "confirm"
  | "submitLoading"
  | "complete"
  | "edit"
  | "editComplete"
  | "cancelConfirmModal"
  | "closed"
  | "fullCapacity"
  | "loginRequired"
  | "networkError"
  | "alreadySubmitted";

export interface RSVPPageProps {
  state?: RSVPPageState;
  invitation?: MockInvitation;
  onBack?: () => void;
}

export const RSVPPage = ({ state = "entry", invitation = mockInvitation, onBack }: RSVPPageProps) => {
  const [status, setStatus] = useState<RSVPValue | undefined>(
    state === "attendingSelected" ? "attending" :
    state === "maybeSelected" ? "maybe" :
    state === "declineSelected" ? "declined" : undefined,
  );
  const [cancelOpen, setCancelOpen] = useState(state === "cancelConfirmModal");

  if (state === "loginRequired") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon="user-round-cog" title="로그인이 필요해요" description="로그인하면 응답할 수 있어요" action={<Button>로그인</Button>} />
        </main>
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon="clock" title="응답이 마감되었어요" description="호스트가 응답 마감을 설정했어요" />
        </main>
      </div>
    );
  }

  if (state === "fullCapacity") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon="users" title="정원이 가득 찼어요" description="미정 / 불참은 선택할 수 있어요" />
        </main>
      </div>
    );
  }

  if (state === "networkError") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <ErrorState title="응답을 보낼 수 없어요" description="네트워크 상태를 확인해주세요" onRetry={() => {}} />
        </main>
      </div>
    );
  }

  if (state === "alreadySubmitted") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState icon="badge-check" title="이미 응답하셨어요" description="응답을 수정할 수 있어요" action={<Button>수정하기</Button>} />
        </main>
      </div>
    );
  }

  if (state === "submitLoading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="응답하기" onBack={onBack} />
        <main className={mobileMainCenter}>
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-[14px] text-text-secondary">응답을 보내는 중...</p>
        </main>
      </div>
    );
  }

  if (state === "complete" || state === "editComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={state === "editComplete" ? "응답 수정" : "응답하기"} />
        <main className={cn(mobileMainCenter, "px-page text-center")}>
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <p className="text-[20px] font-bold text-text-primary">
            {state === "editComplete" ? "응답이 수정됐어요" : "응답이 제출됐어요"}
          </p>
          <p className="text-[14px] text-text-secondary">곧 봬요!</p>
          <Button variant="outline" size="md" className="mt-4">초대장 보기</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background pb-24">
      <TopAppBar className="shrink-0" title={state === "edit" ? "응답 수정" : "응답하기"} onBack={onBack} />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page py-4">
        <InvitationInfoCard variant="datetime" title={invitation.title} description={invitation.date} />

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-text-primary">참석 여부</h2>
          <RSVPButtonGroup
            value={status}
            onValueChange={setStatus}
            layout="horizontal-3"
          />
        </section>

        {status ? (
          <>
            <FormField label="이름" required>
              <TextInput defaultValue={state === "edit" ? "김와라" : ""} placeholder="이름을 입력해주세요" />
            </FormField>
            <FormField label="동반 인원" helper="0 ~ 5명">
              <TextInput type="number" min={0} max={5} defaultValue={0} />
            </FormField>
            <FormField label="요청사항" counter={{ current: 0, max: 200 }}>
              <Textarea placeholder="호스트에게 전할 말씀이 있나요?" rows={3} />
            </FormField>

            <section>
              <h3 className="mb-2 text-[14px] font-bold text-text-primary">알러지가 있나요?</h3>
              <RadioGroup>
                {["없음", "견과류", "유제품", "기타"].map((v) => (
                  <label key={v} className="flex items-center gap-3 rounded-md border border-border p-3">
                    <Radio value={v} />
                    <span className="text-[14px]">{v}</span>
                  </label>
                ))}
              </RadioGroup>
              {state === "requiredQuestionError" ? (
                <p className="mt-1 text-[13px] text-danger">필수 질문에 응답해주세요</p>
              ) : null}
            </section>
          </>
        ) : null}

        {state === "edit" ? (
          <Button variant="text" className="self-center text-danger" onClick={() => setCancelOpen(true)}>응답 취소</Button>
        ) : null}
      </main>

      <div className="relative z-10 shrink-0">
      <StickyCTA
        primary={{
          label: state === "confirm" ? "이대로 보내기" : state === "edit" ? "수정 완료" : "응답하기",
          disabled: !status,
        }}
      />
      </div>

      <ConfirmModal contained
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="응답을 취소할까요?"
        description="다시 응답하려면 처음부터 작성해야 해요"
        confirmLabel="취소"
        confirmVariant="danger"
      />
    </div>
  );
};
