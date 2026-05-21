"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 섹션 제목 */
  heading: ReactNode;
  /** 보조 설명 */
  description?: ReactNode;
  /** 우측 액션 슬롯 (text button 등) */
  action?: ReactNode;
  /** 펼치기/접기 가능 */
  collapsible?: boolean;
  /** 기본 펼침 여부 (collapsible=true 일 때) */
  defaultOpen?: boolean;
  /** 펼침 영역 내용 */
  children?: ReactNode;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader(
    {
      className,
      heading,
      description,
      action,
      collapsible,
      defaultOpen = true,
      children,
      ...props
    },
    ref,
  ) {
    const [open, setOpen] = useState(defaultOpen);

    return (
      <section ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!collapsible}
            onClick={() => collapsible && setOpen((v) => !v)}
            className={cn(
              "flex flex-1 items-center gap-2 text-left",
              collapsible && "active:opacity-70",
            )}
            aria-expanded={collapsible ? open : undefined}
          >
            <h2 className="text-[18px] font-bold text-text-primary">{heading}</h2>
            {collapsible ? (
              <Icon
                name="chevron-down"
                size="sm"
                color="inactive"
                decorative
                className={cn("transition-transform", open ? "rotate-180" : "rotate-0")}
              />
            ) : null}
          </button>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {description ? (
          <p className="text-[14px] text-text-secondary">{description}</p>
        ) : null}
        {children && (!collapsible || open) ? <div>{children}</div> : null}
      </section>
    );
  },
);
