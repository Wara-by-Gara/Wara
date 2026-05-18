"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import InvitationPreview from "./_components/InvitationPreview";
import InvitationForm from "./_components/InvitationForm";
import LoginModal from "./_components/LoginModal";

const DRAFT_KEY = "wara_invitation_draft";

interface DraftFields {
  eventTitle: string;
  date: string;
  time: string;
  location: string;
  hostNote: string;
}

interface PreviewState {
  coverImageUrl: string | null;
  eventTitle: string;
  date: string;
  time: string;
  location: string;
}

function loadDraft(): DraftFields | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftFields) : null;
  } catch {
    return null;
  }
}

function saveDraft(fields: Partial<DraftFields>) {
  try {
    const current = loadDraft() ?? {};
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...fields }));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function CreatePage() {
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [draft, setDraft] = useState<DraftFields | null>(null);
  const [showImageNotice, setShowImageNotice] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({
    coverImageUrl: null,
    eventTitle: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 로그인 후 복귀 시 draft 복원
  useEffect(() => {
    if (!hydrated) return;
    const saved = loadDraft();
    if (saved) {
      setDraft(saved);
      setPreview((prev) => ({ ...prev, ...saved }));
      // 로그인 상태로 돌아온 경우 이미지 재선택 안내
      if (isLoggedIn) setShowImageNotice(true);
    }
  }, [hydrated, isLoggedIn]);

  if (!hydrated) return null;

  const handleChange = (data: Partial<DraftFields> & { coverImageUrl?: string | null }) => {
    const { coverImageUrl, ...textFields } = data;
    saveDraft(textFields);
    setPreview((prev) => ({
      coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : prev.coverImageUrl,
      eventTitle: textFields.eventTitle ?? prev.eventTitle,
      date: textFields.date ?? prev.date,
      time: textFields.time ?? prev.time,
      location: textFields.location ?? prev.location,
    }));
  };

  const handleSubmit = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    clearDraft();
    // TODO: API 연동
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#fbf9f8]/80 backdrop-blur-sm border-b border-[#e4e2e2]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-[#a73921] text-2xl font-bold">WARA</span>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button type="button" aria-label="알림" className="cursor-pointer">
                <BellIcon />
              </button>
            ) : (
              <>
                <button type="button" aria-label="검색" className="cursor-pointer">
                  <SearchIcon />
                </button>
                <button type="button" aria-label="설정" className="cursor-pointer">
                  <SettingsIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 이미지 재선택 안내 배너 */}
      {showImageNotice && (
        <div className="bg-[#a73921]/10 border-b border-[#dfc0b9]">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-[#a73921]">
              ✓ 로그인 완료! 입력하신 정보가 복원됐습니다. 커버 이미지만 다시 선택해주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowImageNotice(false)}
              className="text-[#a73921] hover:opacity-70 cursor-pointer flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 메인 */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.57fr_1fr] gap-10 items-start">
          {/* 왼쪽: 미리보기 (sticky) */}
          <div className="lg:sticky lg:top-24">
            <InvitationPreview
              coverImageUrl={preview.coverImageUrl}
              eventTitle={preview.eventTitle}
              date={preview.date}
              time={preview.time}
              location={preview.location}
            />
          </div>

          {/* 오른쪽: 입력 폼 */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <InvitationForm
              isLoggedIn={isLoggedIn}
              initialValues={draft ?? undefined}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-[#e4e2e2] mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-serif text-[#a73921] text-2xl font-semibold">WARA</span>
            <span className="text-[#505f78] text-sm">© 2026 WARA. 요즘 모이는 방식.</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-[#58423d] text-sm hover:underline">Privacy Policy</a>
            <a href="#" className="text-[#58423d] text-sm hover:underline">Terms of Service</a>
            <a href="#" className="text-[#58423d] text-sm hover:underline">Contact Us</a>
          </nav>
        </div>
      </footer>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
