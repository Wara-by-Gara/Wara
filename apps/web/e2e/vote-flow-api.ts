import fs from "node:fs";
import type { APIRequestContext } from "@playwright/test";
import { API_BASE_URL, authFile, type PersonaKey } from "./personas";

/** E2E 페르소나(storageState)와 동일 계정 */
export const VOTE_HOST_EMAIL = "host001@wara.dev";
export const VOTE_GUEST_EMAIL = "guest001@wara.dev";
export const VOTE_GUEST2_EMAIL = "guest002@wara.dev";

const API = `${API_BASE_URL}/api`;
const FRONTEND_ORIGIN = process.env.E2E_WEB_URL ?? "http://localhost:3000";

function apiHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: FRONTEND_ORIGIN,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const EMAIL_TO_PERSONA: Record<string, PersonaKey> = {
  [VOTE_HOST_EMAIL]: "newHost",
  [VOTE_GUEST_EMAIL]: "guest",
};

const tokenCache = new Map<string, string>();

type ApiBody<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } };

function tokenFromAuthFile(persona: PersonaKey): string | null {
  const filePath = authFile(persona);
  if (!fs.existsSync(filePath)) return null;
  const state = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    cookies: { name: string; value: string }[];
  };
  return state.cookies.find((c) => c.name === "accessToken")?.value ?? null;
}

/** dev/token rate limit 회피 — auth.setup 토큰 우선, guest002 등은 1회 발급 후 캐시 */
export async function devToken(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const cached = tokenCache.get(email);
  if (cached) return cached;

  const persona = EMAIL_TO_PERSONA[email];
  if (persona) {
    const fromAuth = tokenFromAuthFile(persona);
    if (fromAuth) {
      tokenCache.set(email, fromAuth);
      return fromAuth;
    }
  }

  const res = await request.post(`${API}/auth/dev/token`, {
    headers: apiHeaders(),
    data: { email },
  });
  if (!res.ok()) throw new Error(`dev token failed: ${email} ${res.status()}`);
  const body = (await res.json()) as ApiBody<{ accessToken: string }>;
  const token = body.data?.accessToken;
  if (!token) throw new Error(`no accessToken: ${email}`);
  tokenCache.set(email, token);
  return token;
}

export async function apiCall<T>(
  request: APIRequestContext,
  token: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: unknown,
): Promise<{ status: number; data: T | null; errorCode?: string }> {
  const res = await request.fetch(`${API}${path}`, {
    method,
    headers: apiHeaders(token),
    data: data !== undefined ? data : undefined,
  });
  const body = (await res.json().catch(() => ({}))) as ApiBody<T>;
  return {
    status: res.status(),
    data: body.data ?? null,
    errorCode: body.error?.code,
  };
}

export function uniqueTitle(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

export async function createInvitation(
  request: APIRequestContext,
  hostToken: string,
  title: string,
  options?: { eventStartAt?: string | null },
) {
  const payload: Record<string, unknown> = {
    title,
    description: "E2E date vote flow",
    mainGifUrl: "https://static.klipy.com/e2e/test.gif",
    isMissionEnabled: false,
  };
  if (options?.eventStartAt) {
    payload.eventStartAt = options.eventStartAt;
  }
  return apiCall<{ id: string; eventStartAt: string | null; dateVotePollStatus?: string | null }>(
    request,
    hostToken,
    "POST",
    "/invitations",
    payload,
  );
}

export type PollSlotInput = { date: string; startTime?: string; sortOrder?: number };

export async function createDateVotePoll(
  request: APIRequestContext,
  hostToken: string,
  invitationId: string,
  slots: PollSlotInput[],
  options?: { closesAt?: string; isAnonymous?: boolean },
) {
  return apiCall<{
    poll: { id: string; status: string; closesAt: string };
    slots: { id: string; date: string; startTime: string | null }[];
  }>(request, hostToken, "POST", `/invitations/${invitationId}/vote`, {
    isAnonymous: options?.isAnonymous ?? false,
    closesAt: options?.closesAt,
    slots,
  });
}

export async function joinInvitation(
  request: APIRequestContext,
  guestToken: string,
  invitationId: string,
) {
  return apiCall(request, guestToken, "POST", `/invitations/${invitationId}/participants`, {
    rsvpStatus: "attending",
  });
}

export async function submitVoteResponses(
  request: APIRequestContext,
  token: string,
  invitationId: string,
  responses: { slotId: string; response: "good" | "maybe" | "bad" }[],
) {
  return apiCall(request, token, "PUT", `/invitations/${invitationId}/vote/responses`, {
    responses,
  });
}

export async function getVotePoll(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{
    poll: { id: string; status: string; confirmedSlotId: string | null };
    slots: { id: string }[];
    myResponses: unknown[];
  }>(request, token, "GET", `/invitations/${invitationId}/vote`);
}

export async function getVoteResults(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{
    poll: { status: string; confirmedSlotId: string | null };
    slotResults: { slot: { id: string }; counts: { good: number; maybe: number; bad: number } }[];
    voterCount: number;
  }>(request, token, "GET", `/invitations/${invitationId}/vote/results`);
}

export async function closeVotePoll(
  request: APIRequestContext,
  hostToken: string,
  invitationId: string,
) {
  return apiCall<{ status: string; confirmedSlotId: string | null }>(
    request,
    hostToken,
    "POST",
    `/invitations/${invitationId}/vote/close`,
  );
}

export async function confirmVoteSlot(
  request: APIRequestContext,
  hostToken: string,
  invitationId: string,
  slotId: string,
) {
  return apiCall<{ status: string; confirmedSlotId: string }>(
    request,
    hostToken,
    "POST",
    `/invitations/${invitationId}/vote/confirm`,
    { slotId },
  );
}

/** dev 전용: 만료된 open poll 자동 마감 (E2E 스케줄러 검증) */
export async function processExpiredVotePolls(request: APIRequestContext) {
  const res = await request.post(`${API}/dev/vote/process-expired`, {
    headers: apiHeaders(),
  });
  return { status: res.status() };
}

export async function getInvitationDetail(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{
    id: string;
    eventStartAt: string | null;
    dateVotePollStatus?: string | null;
    title: string;
  }>(request, token, "GET", `/invitations/${invitationId}`);
}

/** 미정 일정 + 투표 슬롯이 있는 초대장을 API로 한 번에 준비 */
export async function setupOpenVoteInvitation(
  request: APIRequestContext,
  options?: {
    slots?: PollSlotInput[];
    closesAt?: string;
    isAnonymous?: boolean;
    joinGuests?: string[];
  },
) {
  const hostToken = await devToken(request, VOTE_HOST_EMAIL);
  const title = uniqueTitle("E2E Vote");
  const inv = await createInvitation(request, hostToken, title);
  if (inv.status !== 201 || !inv.data) {
    throw new Error(`createInvitation failed: ${inv.status} ${inv.errorCode}`);
  }

  const slots = options?.slots ?? [
    { date: "2026-08-10", startTime: "18:00", sortOrder: 0 },
    { date: "2026-08-11", startTime: "19:00", sortOrder: 1 },
  ];
  const poll = await createDateVotePoll(request, hostToken, inv.data.id, slots, {
    closesAt: options?.closesAt,
    isAnonymous: options?.isAnonymous,
  });
  if (poll.status !== 201 || !poll.data) {
    throw new Error(`createDateVotePoll failed: ${poll.status} ${poll.errorCode}`);
  }

  const guestTokens: string[] = [];
  for (const email of options?.joinGuests ?? [VOTE_GUEST_EMAIL]) {
    const guestToken = await devToken(request, email);
    const joined = await joinInvitation(request, guestToken, inv.data.id);
    if (joined.status !== 201 && joined.status !== 200) {
      throw new Error(`join failed ${email}: ${joined.status} ${joined.errorCode}`);
    }
    guestTokens.push(guestToken);
  }

  return {
    hostToken,
    guestTokens,
    invitationId: inv.data.id,
    title,
    poll: poll.data.poll,
    slots: poll.data.slots,
  };
}
