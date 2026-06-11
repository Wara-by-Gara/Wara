// HTTP 헤더 이름은 case-insensitive. express는 소문자로 정규화하므로 lookup용 소문자 보관.
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

// 24h — Stripe 표준. 클라이언트 재시도/재설치 윈도우 커버.
export const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export const IDEMPOTENCY_KEY_PREFIX = 'idempotency';

// 처리 중 락 플레이스홀더. 캐시된 응답 JSON과 구분.
export const IDEMPOTENCY_LOCK_PLACEHOLDER = '__processing__';

// 캐시 hit으로 응답을 재생(replay)했음을 클라이언트/관측 도구에 알림.
export const IDEMPOTENCY_REPLAYED_HEADER = 'idempotency-replayed';

// 키 형식: ULID(26자) 또는 UUID(36자, 하이픈 포함)를 자연 허용하는 보수적 범위.
// alnum + hyphen만 허용, 16~128자. 너무 짧으면 충돌 위험, 너무 길면 Redis 키 비대.
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{16,128}$/;
