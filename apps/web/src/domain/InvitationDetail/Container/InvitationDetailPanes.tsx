"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** 커버 이미지 — 모바일 최상단 / 데스크톱 우측(sticky) 상단 */
  cover: ReactNode;
  /**
   * 좌측 메타. 호출부가 기존 모바일 순서(제목·일정 → 설명 → 정보 → 옵션 → 참석자)대로
   * 중첩 래퍼를 그대로 넘긴다.
   */
  left: ReactNode;
  /** RSVP — 모바일 메타 아래 / 데스크톱 우측(sticky) 커버 아래 */
  rsvp?: ReactNode;
  /** 사진 피드 등 — 모바일 최하단 / 데스크톱 좌측 컬럼(정보 아래로 스크롤) */
  feed?: ReactNode;
  /** 데스크톱 우측 고정 액션 레일 (호스트 전용) */
  rail?: ReactNode;
};

/**
 * 초대장 상세 본문 레이아웃.
 * - 모바일/태블릿(<lg): 단일 컬럼 — 커버 → 메타 → RSVP → 피드 (order로 순서 유지).
 * - 데스크톱(lg:): 좌측(메타 + 피드, 스크롤) / 우측(커버 + RSVP, sticky 고정) 2-pane.
 *   래퍼는 모바일에서 `display:contents`로 펼쳐져 main flex의 직접 자식이 되고,
 *   lg:에서 grid 컬럼 블록으로 전환된다.
 */
export function InvitationDetailPanes({ cover, left, rsvp, feed, rail }: Props) {
  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page pb-6",
        "lg:mx-auto lg:grid lg:min-h-0 lg:max-w-5xl lg:flex-none lg:items-start lg:gap-x-10 lg:overflow-visible lg:px-6 lg:pb-16 lg:pt-10",
        "lg:grid-cols-[360px_minmax(0,1fr)]",
        rail && "lg:pr-24",
      )}
    >
      {/* 좌측: 커버 + RSVP (sticky 고정) */}
      <div className="contents lg:sticky lg:top-[calc(var(--header-height)+24px)] lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-4 lg:self-start">
        <div className="pt-4 max-lg:order-1 lg:pt-0">{cover}</div>
        {rsvp ? <div className="max-lg:order-3 max-lg:mt-3">{rsvp}</div> : null}
      </div>

      {/* 우측: 메타 + 피드 (스크롤) */}
      <div className="contents lg:col-start-2 lg:flex lg:flex-col lg:gap-8">
        <div className="flex flex-col gap-5 max-lg:order-2">{left}</div>
        {feed ? <div className="max-lg:order-4 max-lg:mt-3">{feed}</div> : null}
      </div>

      {rail}
    </main>
  );
}
