"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  createAiGeneration,
  getAiGeneration,
  type AiGenerationDetail,
  type AiGenerationStatus,
  type CreateAiGenerationInput,
} from "@/lib/api/aiGenerations";
import { SOCKET_BASE } from "@/lib/env";

// 폴링 간격(ms). WS가 도달 안 하는 모바일 백그라운드 상황의 fallback.
const POLL_INTERVAL_MS = 5_000;
// 최대 대기 시간(ms). BE 60초 + 네트워크/큐 여유.
const MAX_WAIT_MS = 120_000;

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

export function useAiGeneration() {
  const [state, setState] = useState<State>(INITIAL);
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  // 정리. 컴포넌트 unmount나 새 요청 시작 전 호출.
  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
  }, []);

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

      try {
        const created = await createAiGeneration(input);
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
    [cleanup, fetchAndSettle],
  );

  const reset = useCallback(() => {
    cleanup();
    setState(INITIAL);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { ...state, start, reset };
}
