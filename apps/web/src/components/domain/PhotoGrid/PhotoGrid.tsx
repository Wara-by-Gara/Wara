"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PhotoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 컬럼 수 */
  columns?: 2 | 3;
  /** 날짜별 그룹 라벨 (제공 시 자식 영역 위에 sticky-style 표시) */
  groupLabel?: string;
  /** 선택 모드 */
  selectMode?: boolean;
  children: ReactNode;
}

export const PhotoGrid = forwardRef<HTMLDivElement, PhotoGridProps>(
  function PhotoGrid(
    { className, columns = 3, groupLabel, selectMode, children, ...props },
    ref,
  ) {
    return (
      <section
        ref={ref}
        className={cn("flex flex-col gap-2", selectMode && "pb-16", className)}
        {...props}
      >
        {groupLabel ? (
          <h4 className="px-1 text-[15px] font-bold text-text">{groupLabel}</h4>
        ) : null}
        <div
          className={cn(
            "grid gap-1.5",
            columns === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {children}
        </div>
      </section>
    );
  },
);
