"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { InvitePreview } from "./InvitePreview";
import { inviteTemplates } from "./registry/inviteTemplates";
import type { InviteContent } from "./types";

export interface InviteTemplateSelectorProps {
  value: string;
  onValueChange: (id: string) => void;
  /** 미리보기에 채울 샘플 콘텐츠 */
  content?: InviteContent;
  className?: string;
}

/**
 * 템플릿 선택기. radiogroup + 화살표 키 네비게이션.
 * 선택된 항목만 살아있는 모션, 나머지는 정지(성능).
 */
export function InviteTemplateSelector({
  value,
  onValueChange,
  content,
  className,
}: InviteTemplateSelectorProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % inviteTemplates.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + inviteTemplates.length) % inviteTemplates.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = inviteTemplates.length - 1;
    else return;
    e.preventDefault();
    onValueChange(inviteTemplates[next]!.id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="초대장 템플릿 선택"
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}
    >
      {inviteTemplates.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t.name}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "group flex flex-col gap-1.5 rounded-2xl p-1 text-left transition",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
              selected ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-border-strong",
            )}
          >
            <InvitePreview template={t} content={content} animated={selected} />
            <span className="type-caption px-1 pb-1 text-text-muted">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
