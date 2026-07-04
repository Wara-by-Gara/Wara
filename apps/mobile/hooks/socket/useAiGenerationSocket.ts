// 목적: /ai-generations 네임스페이스를 구독해 AI 잡 완료/실패 이벤트를 받는 훅.
// 폴링(useAiCover)이 1차 신뢰 경로이고, 소켓은 완료를 앞당기는 보조 신호로만 쓴다.
//
// 이벤트명은 apps/api/src/ai-generations/ai-generations.gateway.ts에서 확인:
//   - 'generation:completed' { generationId }
//   - 'generation:failed'    { generationId, errorCode }
// (진행률 progress 이벤트는 서버에 없음 — completed/failed만 존재.)
import { useNamespaceSocket, type NamespaceSocket } from './useNamespaceSocket';

type AiProgress = {
  /** 서버의 generationId를 jobId로 노출 (호출 측 폴링 jobId와 동일 개념). */
  jobId: string;
  status: 'completed' | 'failed';
  resultUrl?: string | null;
  errorCode?: string | null;
};

type Options = {
  enabled?: boolean;
  onProgress?: (p: AiProgress) => void;
};

function asRecord(payload: unknown): Record<string, unknown> {
  return payload !== null && typeof payload === 'object'
    ? (payload as Record<string, unknown>)
    : {};
}

export function useAiGenerationSocket(opts: Options = {}): NamespaceSocket {
  const { enabled = true, onProgress } = opts;

  return useNamespaceSocket('/ai-generations', {
    enabled,
    handlers: {
      'generation:completed': (payload) => {
        const data = asRecord(payload);
        const jobId = typeof data.generationId === 'string' ? data.generationId : '';
        if (!jobId) return;
        onProgress?.({ jobId, status: 'completed' });
      },
      'generation:failed': (payload) => {
        const data = asRecord(payload);
        const jobId = typeof data.generationId === 'string' ? data.generationId : '';
        if (!jobId) return;
        const errorCode = typeof data.errorCode === 'string' ? data.errorCode : null;
        onProgress?.({ jobId, status: 'failed', errorCode });
      },
    },
  });
}
