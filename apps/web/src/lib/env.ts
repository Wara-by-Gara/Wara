// 환경변수 기반 URL 베이스 단일 정의.
// fetch/OAuth redirect/Socket.IO 모두 여기에서 import 해서 사용.

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** 백엔드 origin. 카카오 공유 imageUrl 등 외부 크롤러가 접근하는 절대 URL 생성 시 사용. */
export const API_ORIGIN = RAW_API_URL;

/**
 * REST API 베이스. 상대경로(`/api`)로 두어 same-origin 으로 호출한다.
 * 실제 백엔드로는 `next.config.ts` 의 rewrites 가 프록시한다 → 쿠키 정상 공유.
 * 사용 예: `${API_BASE}/auth/kakao/redirect`
 */
export const API_BASE = '/api';

/** Socket.IO 베이스. WebSocket 은 rewrites 프록시 대상이 아니라 직접 연결한다. */
export const SOCKET_BASE = RAW_API_URL;
