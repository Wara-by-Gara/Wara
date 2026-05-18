"use client";

import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  hydrated: boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hydrated: false,
  hydrate: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    set({ isLoggedIn: !!token, hydrated: true });
  },
}));
