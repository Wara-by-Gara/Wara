'use client';

// SW fallbacks 대상 — 오프라인 상태에서 캐시에 없는 문서 요청 시 표시.
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <p className="text-lg font-semibold">오프라인 상태예요</p>
      <p className="text-sm text-gray-400">
        네트워크 연결을 확인한 뒤 다시 시도해주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
      >
        다시 시도
      </button>
    </main>
  );
}
