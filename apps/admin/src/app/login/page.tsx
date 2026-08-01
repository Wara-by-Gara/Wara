'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: '로그인이 취소되었습니다.',
  unauthorized: '관리자 계정이 아닙니다.',
  failed: '로그인에 실패했습니다. 다시 시도해주세요.',
};

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C6.477 3 2 6.582 2 11c0 2.836 1.712 5.328 4.313 6.85L5.25 21l4.313-2.15C10.167 19.28 11.07 19.4 12 19.4c5.523 0 10-3.582 10-8S17.523 3 12 3z"
        fill="#191919"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('auth_error');
  const errorMessage = authError ? (AUTH_ERROR_MESSAGES[authError] ?? AUTH_ERROR_MESSAGES.failed) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c2537]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base leading-none">W</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Wara Admin</p>
            <p className="text-xs text-gray-400 leading-tight">관리자 전용</p>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{errorMessage}</p>
        )}

        <p className="text-sm text-gray-500 mb-6">카카오 계정으로 로그인하세요.</p>

        <a
          href="/api/admin/auth/kakao/redirect"
          className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-xl hover:bg-[#F0D800] transition-colors"
        >
          <KakaoIcon />
          카카오로 로그인
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
