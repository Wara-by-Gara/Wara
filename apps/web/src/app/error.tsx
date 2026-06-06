"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[18px] font-bold text-text-primary">문제가 발생했어요</p>
      <p className="text-[14px] text-text-secondary">잠시 후 다시 시도해주세요</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-white"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-border px-5 py-2.5 text-[14px] text-text-secondary"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
