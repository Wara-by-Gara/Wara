"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@wara/ui";
import { Chip } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { TemplateCard } from "@/components/domain";
import { useAiGeneration } from "@/hooks/useAiGeneration";
import { getTemplates } from "@/lib/api/templates";

const ERROR_MESSAGES: Record<string, string> = {
  AI_TIMEOUT: "AI 처리 시간이 초과됐어요. 잠시 후 다시 시도해주세요.",
  AI_PROCESSING_FAILED: "AI 처리에 실패했어요. 다른 사진으로 시도해보세요.",
  AI_DAILY_LIMIT_EXCEEDED: "오늘 사용 가능한 횟수를 모두 썼어요(하루 3회).",
  AI_SERVICE_UNAVAILABLE: "지금은 AI 사용량이 많아 잠시 후 다시 시도해주세요.",
  AI_TEMPLATE_NOT_FOUND: "선택된 템플릿을 찾을 수 없어요. 다른 템플릿을 선택해주세요.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceImageKey: string | null;
}

export function AiCompositeSheet({ open, onOpenChange, sourceImageKey }: Props) {
  // 합성 전용 templateId. 메인 폼의 templateId와 별도 — AI 결과는 메인 이미지로 반영 안 함.
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
    enabled: open,
  });

  const { status, downloadUrl, errorCode, start, reset } = useAiGeneration();

  const ready = !!templateId && !!sourceImageKey;
  const isProcessing = status === "pending" || status === "processing";
  const isCompleted = status === "completed" && !!downloadUrl;
  const isFailed = status === "failed";

  const handleStart = async () => {
    if (!ready) return;
    try {
      await start({ templateId: templateId!, sourceImageKey: sourceImageKey! });
    } catch {
      // 에러는 hook의 errorCode state로 반영됨.
    }
  };

  const handleClose = (next: boolean) => {
    if (!next && !isProcessing) {
      // 처리 중이면 닫아도 백그라운드 유지. idle/completed/failed일 때만 reset.
      reset();
      setTemplateId(null);
    }
    onOpenChange(next);
  };

  const categories = [...new Set(templates.map((t) => t.theme))].filter(Boolean);
  const filteredTemplates = category
    ? templates.filter((t) => t.theme === category)
    : templates;

  return (
    <BottomSheet open={open} onOpenChange={handleClose} title="AI로 합성하기">
        <div className="flex flex-col gap-5 pt-1">
          <p className="text-[13px] text-text-secondary">
            업로드한 사진과 선택한 배경을 자연스럽게 합성해요. 결과는 다운로드만
            제공되며 대표 이미지에는 영향을 주지 않아요.
          </p>

          {/* 합성용 템플릿(배경) 선택 */}
          <section>
            <p className="mb-2 text-[14px] font-semibold text-text-primary">합성할 배경</p>
            {categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Chip selected={category === ""} onClick={() => setCategory("")}>
                  전체
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    selected={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            )}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredTemplates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    name={t.name}
                    imageUrl={t.previewImageKey}
                    imageAspect="square"
                    variant={templateId === t.id ? "selected" : "basic"}
                    onClick={() => setTemplateId(t.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-text-tertiary">사용 가능한 템플릿이 없어요.</p>
            )}
          </section>

          {/* 상태 */}
          {isProcessing ? (
            <div className="flex items-center gap-3 rounded-lg bg-background-soft px-4 py-3">
              <span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              <p className="text-[13px] text-text-secondary">
                AI가 합성하는 중이에요. 1분 정도 걸려요. 이 화면을 닫아도 처리는 계속돼요.
              </p>
            </div>
          ) : isCompleted ? (
            <a
              href={downloadUrl!}
              download
              className="flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-[14px] font-semibold text-text-inverse"
            >
              결과 다운로드
            </a>
          ) : isFailed ? (
            <p className="text-[13px] text-danger">
              {ERROR_MESSAGES[errorCode ?? ""] ?? "처리 중 문제가 발생했어요."}
            </p>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!ready || isProcessing}
            onClick={handleStart}
          >
            {isCompleted || isFailed ? "다시 시도" : "AI 합성 시작"}
          </Button>
        </div>
      </BottomSheet>
  );
}
