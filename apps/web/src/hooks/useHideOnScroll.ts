"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 아래로 스크롤하면 true(헤더 내용 숨김), 위로 스크롤하거나 최상단이면 false.
 * 모바일 셸 레이아웃은 main이 아닌 문서(window)가 스크롤되므로 window 기준으로 감지한다.
 */
export function useHideOnScroll(threshold = 4): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 0) setHidden(false);
      else if (y > lastY.current + threshold) setHidden(true);
      else if (y < lastY.current - threshold) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
