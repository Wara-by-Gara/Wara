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
  },
}));
