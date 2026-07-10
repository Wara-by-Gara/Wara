'use client';

import { useEffect, useState } from 'react';

// Chromium 전용 이벤트 — 표준 lib.dom에 타입 없음
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'wara-install-dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari 전용 속성
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * 홈 화면 설치 안내 배너.
 * - Chromium(Android/데스크톱): beforeinstallprompt 캡처 → 버튼으로 네이티브 프롬프트 호출
 * - iOS Safari: 프로그래매틱 설치 불가 → "공유 → 홈 화면에 추가" 안내 문구
 * - 이미 설치(standalone)했거나 사용자가 닫으면 표시하지 않음 (닫음은 localStorage 기억)
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    if (isIos()) {
      setShowIosGuide(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDeferredPrompt(null);
    setShowIosGuide(false);
  };

  if (!deferredPrompt && !showIosGuide) return null;

  return (
    <div className="mx-4 my-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">WARA를 홈 화면에 추가</p>
        {showIosGuide ? (
          <p className="mt-0.5 text-xs text-gray-400">
            공유 버튼을 누른 뒤 &lsquo;홈 화면에 추가&rsquo;를 선택하세요
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-gray-400">앱처럼 빠르게 열 수 있어요</p>
        )}
      </div>
      {deferredPrompt && (
        <button
          onClick={async () => {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') dismiss();
          }}
          className="shrink-0 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          설치
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="설치 안내 닫기"
        className="shrink-0 text-sm text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}
