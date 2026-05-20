"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export interface FormFieldProps {
  /** 라벨 텍스트 */
  label: string;
  /** 필수 입력 표시 (*) */
  required?: boolean;
  /** 보조 설명 또는 hint */
  helper?: ReactNode;
  /** 에러 메시지 (있으면 helper 대신 표시) */
  error?: string;
  /** 현재 길이 / 최대 길이 — 우측 카운터 표시 */
  counter?: { current: number; max: number };
  /** 입력 컨트롤 (TextInput, Textarea, 등) */
  children: ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(
    { label, required, helper, error, counter, children, className },
    ref,
  ) {
    const generatedId = useId();
    let inputId = generatedId;
    let inputElement = children;
    if (isValidElement<{ id?: string }>(children)) {
      const existingId = children.props?.id;
      inputId = existingId ?? generatedId;
      inputElement = cloneElement(children, { id: inputId });
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={inputId}
          className="text-[14px] font-medium text-text-primary"
        >
          {label}
          {required ? <span className="text-primary"> *</span> : null}
        </label>
        {Children.count(inputElement) > 0 ? inputElement : null}
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[13px]",
              error ? "text-danger" : "text-text-tertiary",
            )}
          >
            {error || helper}
          </span>
          {counter ? (
            <span className="shrink-0 text-[13px] text-text-tertiary">
              {counter.current} / {counter.max}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
