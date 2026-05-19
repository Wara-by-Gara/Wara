// 와라 API 응답 envelope (docs/api/api.md 기준)
// 성공: { success: true, data: T, meta?: {...} }
// 실패: { success: false, error: { code, type, message, details? }, meta: {...} }

export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
  // 목록 응답은 페이지네이션 메타 추가
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    type:
      | 'invalid_request'
      | 'authentication'
      | 'authorization'
      | 'not_found'
      | 'conflict'
      | 'rate_limit'
      | 'service_unavailable'
      | 'server_error';
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

/**
 * 와라 API 에러 — fetcher가 4xx/5xx 응답 시 throw.
 * UI 레이어는 `error.code`(docs/conventions/error-codes.md 기준)로 분기.
 */
export class WaraApiError extends Error {
  readonly code: string;
  readonly type: ApiErrorBody['error']['type'];
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(params: {
    code: string;
    type: ApiErrorBody['error']['type'];
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'WaraApiError';
    this.code = params.code;
    this.type = params.type;
    this.status = params.status;
    this.details = params.details;
    this.requestId = params.requestId;
  }
}

/**
 * 네트워크 자체 실패(서버 못 닿음, JSON 파싱 실패 등).
 * 백엔드가 envelope를 못 반환한 케이스 — 재시도/오프라인 표시 대상.
 */
export class WaraNetworkError extends Error {
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'WaraNetworkError';
    this.cause = cause;
  }
}
