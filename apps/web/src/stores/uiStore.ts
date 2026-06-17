"use client";

import { create } from "zustand";

interface UiState {
  /** 댓글 입력창 포커스 여부 — true면 하단 탭(MainBottomNav)을 숨긴다 */
  commentInputFocused: boolean;
  setCommentInputFocused: (focused: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commentInputFocused: false,
  setCommentInputFocused: (focused) => set({ commentInputFocused: focused }),
}));
