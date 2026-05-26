"use client";

import { create } from "zustand";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

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
    const isLoggedIn =
      typeof window !== "undefined" &&
      document.cookie.split("; ").some((row) => row.startsWith("is_logged_in="));
    set({ isLoggedIn, hydrated: true });
  },
  login: () => {
    set({ isLoggedIn: true });
  },
  logout: async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    set({ isLoggedIn: false });
  },
}));
