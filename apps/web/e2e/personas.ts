export type PersonaKey =
  | "newHost"
  | "hostOperator"
  | "hostNew"
  | "guest"
  | "guest2"
  | "guestNoPhoto"
  | "guestBlocked"
  | "guestRsvpAbsent"
  | "admin";

export interface Persona {
  key: PersonaKey;
  email: string;
  description: string;
}

// dev-auth 화이트리스트(apps/api/src/dev/dev-auth.service.ts)와 동기화되어야 함.
export const PERSONAS: Persona[] = [
  { key: "newHost", email: "host001@wara.dev", description: "초대장 생성/공유/호스트 상세" },
  { key: "hostOperator", email: "host002@wara.dev", description: "시드된 초대장 운영" },
  { key: "hostNew", email: "host003@wara.dev", description: "추가 호스트 — 크로스 페르소나·권한 경계 테스트" },
  { key: "guest", email: "guest001@wara.dev", description: "RSVP/사진/댓글 게스트" },
  { key: "guest2", email: "guest002@wara.dev", description: "단톡방 3번째 멤버" },
  {
    key: "guestNoPhoto",
    email: "guest003@wara.dev",
    description: "프로필 사진 없음 — DiceBear fallback 검증",
  },
  {
    key: "guestBlocked",
    email: "guest004@wara.dev",
    description: "차단·권한 에러 UI 검증용 추가 게스트",
  },
  {
    key: "guestRsvpAbsent",
    email: "guest005@wara.dev",
    description: "absent RSVP 상태 접근 제한 검증용 게스트",
  },
  { key: "admin", email: "admin@wara.dev", description: "관리자(문의/FAQ/대시보드)" },
];

// macOS에서 "localhost"는 IPv6(::1)을 먼저 시도한다. next dev(turbopack)가 IPv4 위주로
// 바인딩돼 있어 ::1 연결이 간헐적으로 거부(ECONNREFUSED ::1:3000)되므로 127.0.0.1로 고정한다.
export const API_BASE_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3001";
export const WEB_BASE_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

export function authFile(key: PersonaKey | string): string {
  return `e2e/.auth/${key}.json`;
}
