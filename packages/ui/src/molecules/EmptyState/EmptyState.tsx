import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName } from "../../icons/index.ts";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** 하단 CTA 슬롯 */
  action?: ReactNode;
}

export function EmptyState({
  className,
  icon = "sparkle",
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-surface-muted text-text-muted">
        <Icon name={icon} size="lg" color="currentColor" decorative />
      </span>
      <h2 className="type-cardTitle text-text">{title}</h2>
      {description ? (
        <p className="type-bodySmall max-w-xs text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
