"use client";

import { useEffect } from "react";

/** document root에 라이트 모드 시맨틱 토큰 적용 */
export function useLightTheme(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("theme-light");
    return () => root.classList.remove("theme-light");
  }, [enabled]);
}
