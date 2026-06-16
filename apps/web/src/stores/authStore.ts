"use client";

import { create } from "zustand";
import { isLoggedInCookieSet } from "@/lib/auth-cookie";
import { API_BASE } from "@/lib/env";
import { getQueryClient } from "@/lib/query-client";

interface AuthState {
  isLoggedIn: boolean;
  hydrated: boolean;
  hydrate: () => void;
  login: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hydrated: false,
  hydrate: () => {
    set({ isLoggedIn: isLoggedInCookieSet(), hydrated: true });
  },
  login: () => {
    set({ isLoggedIn: true });
  },
  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    document.cookie = "accessToken=; Max-Age=0; path=/";
    document.cookie = "refreshToken=; Max-Age=0; path=/";
    document.cookie = "is_logged_in=; Max-Age=0; path=/";
    getQueryClient().clear();
    set({ isLoggedIn: false });
    // 다른 탭에 로그아웃 전파 (storage 이벤트는 다른 탭에서만 발화).
    // 민감정보가 아닌 타임스탬프 신호만 저장 — 값이 바뀌어야 이벤트가 발화하므로 매번 now.
    try {
      localStorage.setItem("wara_logout", String(Date.now()));
    } catch {
      // private 모드 등 localStorage 불가 시 무시 (단일 탭 로그아웃은 정상 동작)
    }
  },
}));
