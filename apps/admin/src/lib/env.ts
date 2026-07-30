const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const API_ORIGIN = RAW_API_URL;

/**
 * REST API 베이스. 상대경로(/api)로 두어 same-origin으로 호출.
 * 실제 백엔드로는 next.config.ts의 rewrites가 프록시한다 → 쿠키 정상 공유.
 */
export const API_BASE = '/api';
