// 목적: 초대장 메인 이미지에 AI를 적용해 완성된 커버 URL을 얻는 오케스트레이션 훅.
// 폴링(getAiJobStatus 2초 간격)을 1차 신뢰 경로로 쓰고, /ai-generations 소켓은
// 완료 신호를 앞당기는 보조로만 사용한다(즉시 1회 폴링 트리거).
import { useCallback, useEffect, useRef, useState } from 'react';

import { applyAiToMainImage, getAiJobStatus, WaraApiError } from '@/api';

import { useAiGenerationSocket } from './socket/useAiGenerationSocket';

type AiCoverStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

// errorCode → 한국어 사용자 메시지. message 원문 노출 금지(error-codes.md 규칙).
function messageForCode(code: string | null): string {
  switch (code) {
    case 'AI_DAILY_LIMIT_EXCEEDED':
      return '하루 생성 횟수를 초과했어요';
    case 'AI_SERVICE_UNAVAILABLE':
      return '잠시 후 다시 시도해주세요';
    case 'AI_TIMEOUT':
      return '잠시 후 다시 시도해주세요';
    default:
      return 'AI 생성에 실패했어요';
  }
}

export function useAiCover(invitationId: string) {
  const [status, setStatus] = useState<AiCoverStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef<number>(0);
  // 언마운트 후 setState 방지.
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishFailed = useCallback(
    (code: string | null) => {
      stopPolling();
      jobIdRef.current = null;
      if (!mountedRef.current) return;
      setStatus('failed');
      setError(messageForCode(code));
    },
    [stopPolling],
  );

  // 잡 상태 1회 조회 후 상태 반영. 완료/실패면 폴링 종료.
  const poll = useCallback(async () => {
    const jobId = jobIdRef.current;
    if (!jobId) return;

    if (Date.now() > deadlineRef.current) {
      finishFailed('AI_TIMEOUT');
      return;
    }

    try {
      const job = await getAiJobStatus(invitationId, jobId);
      if (!mountedRef.current || jobIdRef.current !== jobId) return;

      if (job.status === 'processing') {
        setStatus('processing');
        return;
      }
      if (job.status === 'completed') {
        stopPolling();
        jobIdRef.current = null;
        setStatus('completed');
        setResultUrl(job.resultUrl);
        return;
      }
      if (job.status === 'failed') {
        finishFailed(job.errorCode);
        return;
      }
      // pending: 계속 폴링.
    } catch (err) {
      const code = err instanceof WaraApiError ? err.code : null;
      finishFailed(code);
    }
  }, [invitationId, finishFailed, stopPolling]);

  const generate = useCallback(
    (imageKey: string) => {
      // 진행 중이면 무시(중복 방지).
      if (jobIdRef.current !== null) return;

      setStatus('pending');
      setResultUrl(null);
      setError(null);

      applyAiToMainImage(invitationId, imageKey)
        .then(({ jobId }) => {
          if (!mountedRef.current) return;
          jobIdRef.current = jobId;
          deadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
          stopPolling();
          intervalRef.current = setInterval(() => {
            void poll();
          }, POLL_INTERVAL_MS);
          void poll();
        })
        .catch((err: unknown) => {
          const code = err instanceof WaraApiError ? err.code : null;
          finishFailed(code);
        });
    },
    [invitationId, poll, stopPolling, finishFailed],
  );

  const reset = useCallback(() => {
    stopPolling();
    jobIdRef.current = null;
    setStatus('idle');
    setResultUrl(null);
    setError(null);
  }, [stopPolling]);

  // 소켓 완료/실패 신호 → 폴링을 기다리지 않고 즉시 1회 확인.
  useAiGenerationSocket({
    enabled: status === 'pending' || status === 'processing',
    onProgress: (p) => {
      if (p.jobId !== jobIdRef.current) return;
      if (p.status === 'failed') {
        finishFailed(p.errorCode ?? null);
        return;
      }
      // completed: resultUrl은 폴링 응답으로 채운다(소켓 payload엔 없음).
      void poll();
    },
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  return {
    generate,
    status,
    resultUrl,
    isGenerating: status === 'pending' || status === 'processing',
    error,
    reset,
  };
}
