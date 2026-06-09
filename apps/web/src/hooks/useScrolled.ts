"use client";

import { useEffect, useState } from "react";

/**
 * 문서(window)가 최상단보다 아래로 스크롤됐는지 여부.
 * 모바일 셸은 main이 아닌 window가 스크롤되므로 window 기준으로 감지한다.
 * 최상단이면 false, 조금이라도 내려가면 true.
 */
export function useScrolled(threshold = 0): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
