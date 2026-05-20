"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface LoginModalProps {
  onClose: () => void;
  returnUrl?: string;
}

function redirectToOAuth(provider: "kakao" | "naver", returnUrl?: string) {
  if (returnUrl) localStorage.setItem("wara_return_url", returnUrl);
  window.location.href = `${API_URL}/auth/${provider}/redirect`;
}

export default function LoginModal({ onClose, returnUrl }: LoginModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-10 flex flex-col gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-serif text-[#1b1c1c] text-3xl font-bold">Welcome to WARA</h2>
          <p className="text-[#58423d] text-sm leading-relaxed">
            Start creating beautiful memories with<br />your loved ones.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 border border-[#e4e2e2] rounded-xl py-3.5 text-[#1b1c1c] font-semibold text-sm opacity-40 cursor-not-allowed"
          >
            <AppleIcon />
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={() => redirectToOAuth("naver", returnUrl)}
            className="w-full flex items-center justify-center gap-3 bg-[#03c75a] rounded-xl py-3.5 text-white font-semibold text-sm hover:bg-[#02b350] transition-colors cursor-pointer"
          >
            <NaverIcon />
            Continue with Naver
          </button>
          <button
            type="button"
            onClick={() => redirectToOAuth("kakao", returnUrl)}
            className="w-full flex items-center justify-center gap-3 bg-[#fee500] rounded-xl py-3.5 text-[#191919] font-semibold text-sm hover:bg-[#f0d900] transition-colors cursor-pointer"
          >
            <KakaoIcon />
            Continue with Kakao
          </button>
        </div>

        <p className="text-center text-[#58423d] text-xs leading-relaxed">
          By continuing, you agree to WARA&apos;s{" "}
          <a href="#" className="underline hover:text-[#a73921]">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="underline hover:text-[#a73921]">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const NaverIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.548 1.516 4.787 3.812 6.134l-.97 3.625 4.2-2.764A11.5 11.5 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
  </svg>
);
