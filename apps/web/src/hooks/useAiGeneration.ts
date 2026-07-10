"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import {
  createAiGeneration,
  getAiGeneration,
  getAiQuota,
  type AiGenerationDetail,
  type AiGenerationStatus,
  type CreateAiGenerationInput,
} from "@/lib/api/aiGenerations";
import { SOCKET_BASE } from "@/lib/env";

/** 오늘 남은 AI 생성 횟수 조회. */
export function useAiQuota(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["ai", "quota"],
    queryFn: getAiQuota,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

// 폴링 간격(ms). WS가 도달 안 하는 모바일 백그라운드 상황의 fallback.
const POLL_INTERVAL_MS = 5_000;
// 최대 대기 시간(ms). BE는 60초 timeout × 최대 3회(재시도 2회) + 백오프(1·2초) ≈ 183s가
// 최악 시나리오. FE는 그 위에 네트워크/큐 여유까지 더해 200s로 설정.
const MAX_WAIT_MS = 200_000;

interface State {
  status: "idle" | AiGenerationStatus;
  id: string | null;
  downloadUrl: string | null;
  errorCode: string | null;
}

const INITIAL: State = {
  status: "idle",
  id: null,
  downloadUrl: null,
  errorCode: null,
};

// 백엔드 IDEMPOTENCY_KEY_PATTERN: alnum + 하이픈, 16~128자.
// crypto.randomUUID()는 보안 컨텍스트(https/localhost)에서만 제공되므로 fallback도 둠.
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  return `ai-${ts}-${rand}`;
}

export function useAiGeneration() {
  const [state, setState] = useState<State>(INITIAL);
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  // 폴링만 정리 — WS 수신 후 즉시 폴링을 끄는 용도로도 재사용.
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 정리. 컴포넌트 unmount나 새 요청 시작 전 호출.
  const cleanup = useCallback(() => {
    stopPolling();
    if (socketRef.current) {
      // listener 제거 후 disconnect — 끊는 도중 마지막 이벤트 콜백이 실행되며
      // setState를 다시 트리거하는 것 방지.
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [stopPolling]);

  // 완료/실패 상태가 확정되면 정리. 결과는 state로 유지.
  const settleFromDetail = useCallback(
    (detail: AiGenerationDetail) => {
      setState((prev) => ({
        ...prev,
        status: detail.status,
        downloadUrl: detail.downloadUrl,
        errorCode: detail.errorCode,
      }));
      if (detail.status === "completed" || detail.status === "failed") {
        cleanup();
      }
    },
    [cleanup],
  );

  const fetchAndSettle = useCallback(
    async (id: string) => {
      try {
        const detail = await getAiGeneration(id);
        settleFromDetail(detail);
      } catch {
        // 일시 실패. 다음 폴링 cycle에 재시도.
      }
    },
    [settleFromDetail],
  );

  const start = useCallback(
    async (input: CreateAiGenerationInput) => {
      cleanup();
      setState({ ...INITIAL, status: "pending" });

      // 더블클릭/네트워크 재전송 시 같은 요청이 두 번 생성돼 daily quota를
      // 한 번에 소진하는 것을 방지하기 위한 멱등성 키.
      const idempotencyKey = generateIdempotencyKey();

      try {
        const created = await createAiGeneration(input, idempotencyKey);
        startedAtRef.current = Date.now();
        setState((prev) => ({ ...prev, id: created.id, status: created.status }));

        // WS 구독 — completed/failed 즉시 수신용. 폴링은 fallback.
        const socket = io(`${SOCKET_BASE}/ai-generations`, {
          withCredentials: true,
          transports: ["websocket"],
          reconnection: true,
        });
        socketRef.current = socket;

        socket.on("generation:completed", (payload: { generationId: string }) => {
          if (payload.generationId === created.id) {
            // WS가 도착했으니 폴링은 즉시 끔 — 중복 fetch 방지.
            stopPolling();
            void fetchAndSettle(created.id);
          }
        });
        socket.on("generation:failed", (payload: { generationId: string; errorCode: string }) => {
          if (payload.generationId === created.id) {
            setState((prev) => ({
              ...prev,
              status: "failed",
              errorCode: payload.errorCode,
            }));
            cleanup();
          }
        });

        // 폴링 fallback.
        pollTimerRef.current = setInterval(() => {
          if (Date.now() - startedAtRef.current > MAX_WAIT_MS) {
            cleanup();
            setState((prev) => ({ ...prev, status: "failed", errorCode: "AI_TIMEOUT" }));
            return;
          }
          void fetchAndSettle(created.id);
        }, POLL_INTERVAL_MS);

        return created.id;
      } catch (e) {
        const code = e instanceof Error ? e.message : "AI_PROCESSING_FAILED";
        setState((prev) => ({ ...prev, status: "failed", errorCode: code }));
        cleanup();
        throw e;
      }
    },
    [cleanup, fetchAndSettle, stopPolling],
  );

  const reset = useCallback(() => {
    cleanup();
    setState(INITIAL);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { ...state, start, reset };
}
