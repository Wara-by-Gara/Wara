export type PersonaKey = "newHost" | "hostOperator" | "guest" | "admin";

export interface Persona {
  key: PersonaKey;
  email: string;
  description: string;
}

// dev-auth 화이트리스트(apps/api/src/dev/dev-auth.service.ts)와 동기화되어야 함.
export const PERSONAS: Persona[] = [
  { key: "newHost", email: "host001@wara.dev", description: "초대장 생성/공유/호스트 상세" },
  { key: "hostOperator", email: "host002@wara.dev", description: "시드된 초대장 운영" },
  { key: "guest", email: "guest001@wara.dev", description: "RSVP/사진/댓글 게스트" },
  { key: "admin", email: "admin@wara.dev", description: "관리자(문의/FAQ/대시보드)" },
];

export const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
export const WEB_BASE_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";

export function authFile(key: PersonaKey | string): string {
  return `e2e/.auth/${key}.json`;
}
