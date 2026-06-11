// HTTP 헤더 이름은 case-insensitive. express는 소문자로 정규화하므로 lookup용 소문자 보관.
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

// 24h — Stripe 표준. 클라이언트 재시도/재설치 윈도우 커버.
export const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export const IDEMPOTENCY_KEY_PREFIX = 'idempotency';

// 처리 중 락 플레이스홀더. 캐시된 응답 JSON과 구분.
export const IDEMPOTENCY_LOCK_PLACEHOLDER = '__processing__';
