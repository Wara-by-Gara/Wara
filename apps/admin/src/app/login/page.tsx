'use client';

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

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M16.273 12.845L7.376 3H3v18h7.727V11.155L19.624 21H24V3h-7.727v9.845z"
        fill="white"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {/* 로고 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base leading-none">W</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Wara Admin</p>
            <p className="text-xs text-gray-400 leading-tight">관리자 전용</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">소셜 계정으로 로그인하세요.</p>

        <div className="flex flex-col gap-2.5">
          <a
            href="/api/auth/kakao/redirect"
            className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-xl hover:bg-[#F0D800] transition-colors"
          >
            <KakaoIcon />
            카카오로 로그인
          </a>
          <a
            href="/api/auth/naver/redirect"
            className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#03C75A] text-white text-sm font-medium rounded-xl hover:bg-[#02B350] transition-colors"
          >
            <NaverIcon />
            네이버로 로그인
          </a>
          <a
            href="/api/auth/google/redirect"
            className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            Google로 로그인
          </a>
        </div>
      </div>
    </div>
  );
}
