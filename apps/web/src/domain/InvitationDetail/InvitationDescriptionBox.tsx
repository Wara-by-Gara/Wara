import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InvitationDescriptionBoxProps {
  children: string;
  fontClass?: string;
  bgColor?: string;
  /** 소개글 아래 divider로 구분해 표시할 추가 내용 (공지 등 모임 옵션) */
  footer?: ReactNode;
}

export function InvitationDescriptionBox({ children, fontClass, bgColor, footer }: InvitationDescriptionBoxProps) {
  const isDarkBg = bgColor?.includes('aurora') || bgColor?.includes('starry');
  return (
    <div className="flex flex-col gap-3 rounded-md border border-white/40 bg-white/20 px-4 py-3 shadow-xs backdrop-blur-md backdrop-saturate-150">
      {footer ? (
        <>
          {footer}
          <div className={cn("border-t", isDarkBg ? "border-white/25" : "border-black/10")} />
        </>
      ) : null}
      <p className={cn("whitespace-pre-line text-left text-[15px] leading-[1.6]", isDarkBg ? "text-white" : "text-text", fontClass)}>
        {children}
      </p>
    </div>
  );
}
