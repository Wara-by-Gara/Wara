"use client";

import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  hydrated: boolean;
  hydrate: () => void;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hydrated: false,
  hydrate: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    set({ isLoggedIn: !!token, hydrated: true });
  },
  login: (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ isLoggedIn: false });
  },
}));
