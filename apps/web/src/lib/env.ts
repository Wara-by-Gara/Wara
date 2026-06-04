// 환경변수 기반 URL 베이스 단일 정의.
// fetch/OAuth redirect/Socket.IO 모두 여기에서 import 해서 사용.

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** REST API 베이스. 사용 예: `${API_BASE}/auth/kakao/redirect` */
export const API_BASE = `${RAW_API_URL}/api`;

/** Socket.IO 베이스. 네임스페이스를 붙여서 사용. 예: `${SOCKET_BASE}/notifications` */
export const SOCKET_BASE = RAW_API_URL;
