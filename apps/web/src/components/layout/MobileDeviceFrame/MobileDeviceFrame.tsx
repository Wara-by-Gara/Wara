import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HomeIndicator } from "./HomeIndicator";
import { StatusBar } from "./StatusBar";

export interface MobileDeviceFrameProps {
  children: ReactNode;
  className?: string;
  /** 상태바·홈 인디케이터 영역까지 콘텐츠가 깔리고 크롬 배경은 투명 */
  immersive?: boolean;
}

export function MobileDeviceFrame({
  children,
  className,
  immersive = false,
}: MobileDeviceFrameProps) {
  return (
    <div
      className={cn(
        "relative flex h-[852px] w-[393px] shrink-0 overflow-hidden rounded-[50px] border-[8px] border-black shadow-2xl",
        immersive ? "bg-transparent" : "bg-white",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[36px]">
        <div
          className={cn(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            !immersive && "pt-[44px] pb-[34px]",
            immersive && "overflow-hidden",
          )}
        >
          <div className="mobile-frame-viewport h-full min-h-0 w-full">{children}</div>
        </div>
        {!immersive ? (
          <>
            <StatusBar className="absolute inset-x-0 top-0 z-50" />
            <HomeIndicator className="absolute inset-x-0 bottom-0 z-50" />
          </>
        ) : null}
      </div>
    </div>
  );
}
