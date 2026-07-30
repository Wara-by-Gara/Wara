'use client';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Wara Admin</h1>
        <p className="text-sm text-gray-500 mb-8">관리자 계정으로 로그인하세요</p>
        <div className="flex flex-col gap-3">
          <a
            href="/api/auth/kakao/redirect"
            className="flex items-center justify-center w-full py-2.5 px-4 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-lg hover:bg-[#F0D800] transition-colors"
          >
            카카오로 로그인
          </a>
          <a
            href="/api/auth/naver/redirect"
            className="flex items-center justify-center w-full py-2.5 px-4 bg-[#03C75A] text-white text-sm font-medium rounded-lg hover:bg-[#02B350] transition-colors"
          >
            네이버로 로그인
          </a>
          <a
            href="/api/auth/google/redirect"
            className="flex items-center justify-center w-full py-2.5 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Google로 로그인
          </a>
        </div>
      </div>
    </div>
  );
}
