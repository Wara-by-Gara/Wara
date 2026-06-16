"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn.ts";

export interface FormFieldProps {
  label: string;
  /** 필수 입력 표시 (*) */
  required?: boolean;
  /** 보조 설명 */
  helper?: ReactNode;
  /** 에러 메시지 (있으면 helper 대신 표시, 컨트롤에 invalid 전달) */
  error?: string;
  /** 우측 글자수 카운터 */
  counter?: { current: number; max: number };
  /** 입력 컨트롤 (Input, Textarea 등) */
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  helper,
  error,
  counter,
  children,
  className,
}: FormFieldProps) {
  const id = useId();
  const controlId = `${id}-control`;
  const descId = `${id}-desc`;
  const hasDesc = Boolean(error || helper);

  let control = children;
  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    control = cloneElement(child, {
      id: (child.props.id as string) ?? controlId,
      "aria-describedby": hasDesc ? descId : undefined,
      "aria-invalid": error ? true : undefined,
      invalid: error ? true : child.props.invalid,
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={isValidElement(children) ? controlId : undefined}
        className="type-bodySmall font-medium text-text"
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {control}
      {hasDesc || counter ? (
        <div className="flex items-start justify-between gap-2">
          <span
            id={descId}
            className={cn(
              "type-caption",
              error ? "text-danger" : "text-text-muted",
            )}
          >
            {error || helper}
          </span>
          {counter ? (
            <span className="type-caption shrink-0 text-text-muted">
              {counter.current} / {counter.max}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
