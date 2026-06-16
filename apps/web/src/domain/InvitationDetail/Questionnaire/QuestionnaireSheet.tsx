"use client";

import { useState } from "react";
import { BottomSheet, Button, Input, Icon, toast } from "@wara/ui";
import {
  useQuestions,
  useCreateQuestion,
  useDeleteQuestion,
  useQuestionAnswers,
} from "@/hooks/useQuestionnaire";

interface Props {
  invitationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 호스트 — 맞춤 질문 추가·삭제 + 응답 열람 */
export function QuestionnaireSheet({ invitationId, open, onOpenChange }: Props) {
  const [text, setText] = useState("");
  const { data: questions } = useQuestions(invitationId, { enabled: open });
  const { data: answersData } = useQuestionAnswers(invitationId, { enabled: open });
  const { mutate: create, isPending: isCreating } = useCreateQuestion(invitationId);
  const { mutate: remove } = useDeleteQuestion(invitationId);

  const handleAdd = () => {
    const q = text.trim();
    if (!q) return;
    create(
      { question: q },
      {
        onSuccess: () => setText(""),
        onError: () => toast.error("질문 추가에 실패했어요"),
      },
    );
  };

  const answersByQuestion = new Map(
    (answersData?.questions ?? []).map((q) => [q.id, q.answers]),
  );

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="맞춤 질문"
      description="참석자가 응답할 때 답하는 질문이에요"
    >
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="질문을 입력하세요 (예: 식사 알레르기 있나요?)"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="md"
            onClick={handleAdd}
            disabled={!text.trim() || isCreating}
          >
            추가
          </Button>
        </div>

        {questions && questions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {questions.map((q) => {
              const answers = answersByQuestion.get(q.id) ?? [];
              return (
                <div key={q.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="type-body flex-1 text-text">{q.question}</p>
                    <button
                      type="button"
                      aria-label="질문 삭제"
                      onClick={() => remove(q.id)}
                      className="shrink-0 text-text-tertiary hover:text-danger"
                    >
                      <Icon name="x" size="sm" color="currentColor" decorative />
                    </button>
                  </div>
                  {answers.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                      <p className="type-caption text-text-muted">응답 {answers.length}개</p>
                      {answers.map((a, i) => (
                        <p key={i} className="type-bodySmall text-text-muted">
                          · {a.answer}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center type-bodySmall text-text-muted">
            아직 질문이 없어요
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
