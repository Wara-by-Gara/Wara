"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 px-page text-center">
        <p className="text-[18px] font-bold">문제가 발생했어요</p>
        <p className="text-[14px] text-gray-500">잠시 후 다시 시도해주세요</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-cranberry-50 px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
