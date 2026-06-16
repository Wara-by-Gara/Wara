import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName } from "../../icons/index.ts";
import { Button } from "../../atoms/index.ts";

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** 있으면 다시 시도 버튼 자동 렌더 */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  className,
  icon = "alert-triangle",
  title,
  description,
  onRetry,
  retryLabel = "다시 시도",
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Icon name={icon} size="lg" color="currentColor" decorative />
      </span>
      <h2 className="type-cardTitle text-text">{title}</h2>
      {description ? (
        <p className="type-bodySmall max-w-xs text-text-muted">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
