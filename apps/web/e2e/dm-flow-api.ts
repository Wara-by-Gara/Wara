import type { APIRequestContext } from "@playwright/test";
import { apiCall, devToken, VOTE_HOST_EMAIL, VOTE_GUEST_EMAIL, VOTE_GUEST2_EMAIL } from "./vote-flow-api";

export { devToken, apiCall };

export const DM_USER_A = VOTE_HOST_EMAIL;
export const DM_USER_B = VOTE_GUEST_EMAIL;
export const DM_USER_C = VOTE_GUEST2_EMAIL;
export const DM_USER_D = "host002@wara.dev";

const API = `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api`;
const ORIGIN = process.env.E2E_WEB_URL ?? "http://localhost:3000";

/** 존재하지 않을 법한 ULID */
export const FAKE_ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

export type DmMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  deleted: boolean;
  edited: boolean;
  replyTo: { id: string; senderId: string; content: string; deleted: boolean } | null;
};

export function uniqueDmText(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

export async function getMe(request: APIRequestContext, token: string) {
  return apiCall<{ id: string; name?: string | null }>(request, token, "GET", "/users/me");
}

export async function createConversation(
  request: APIRequestContext,
  token: string,
  targetUserId: string,
) {
  return apiCall<{ id: string }>(request, token, "POST", "/conversations", { targetUserId });
}

export async function getConversations(request: APIRequestContext, token: string) {
  return apiCall<
    {
      id: string;
      partner: { id: string; name: string | null };
      lastMessageText: string | null;
      unreadCount: number;
    }[]
  >(request, token, "GET", "/conversations");
}

export async function getConversation(
  request: APIRequestContext,
  token: string,
  conversationId: string,
) {
  return apiCall<{
    id: string;
    partner: { id: string; name: string | null };
    partnerLastReadAt: string | null;
  }>(request, token, "GET", `/conversations/${conversationId}`);
}

export async function getMessages(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  options?: { cursor?: string; limit?: number },
) {
  const q = new URLSearchParams();
  if (options?.cursor) q.set("cursor", options.cursor);
  if (options?.limit != null) q.set("limit", String(options.limit));
  const qs = q.toString();
  return apiCall<{ messages: DmMessage[]; nextCursor: string | null }>(
    request,
    token,
    "GET",
    `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
  );
}

export async function sendMessage(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  content: string,
  replyToMessageId?: string,
) {
  return apiCall<DmMessage>(request, token, "POST", `/conversations/${conversationId}/messages`, {
    content,
    ...(replyToMessageId ? { replyToMessageId } : {}),
  });
}

export async function editMessage(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  messageId: string,
  content: string,
) {
  return apiCall<DmMessage>(
    request,
    token,
    "PATCH",
    `/conversations/${conversationId}/messages/${messageId}`,
    { content },
  );
}

export async function deleteMessage(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  messageId: string,
) {
  const res = await request.fetch(
    `${API}/conversations/${conversationId}/messages/${messageId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
    },
  );
  return { status: res.status() };
}

export async function markRead(
  request: APIRequestContext,
  token: string,
  conversationId: string,
) {
  const res = await request.fetch(`${API}/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
  return { status: res.status() };
}

export async function leaveConversation(
  request: APIRequestContext,
  token: string,
  conversationId: string,
) {
  const res = await request.fetch(`${API}/conversations/${conversationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
  return { status: res.status() };
}

export async function getUnreadCount(request: APIRequestContext, token: string) {
  return apiCall<{ count: number }>(request, token, "GET", "/conversations/unread-count");
}

export type DmPairFixture = {
  conversationId: string;
  tokenA: string;
  tokenB: string;
  userAId: string;
  userBId: string;
  partnerNameB: string | null;
};

/** 1:1 대화방 + 선택적 시드 메시지 */
export async function setupDmPair(
  request: APIRequestContext,
  emailA: string,
  emailB: string,
  options?: { seedMessage?: string; seedFrom?: "A" | "B" },
): Promise<DmPairFixture> {
  const tokenA = await devToken(request, emailA);
  const tokenB = await devToken(request, emailB);
  const meB = await getMe(request, tokenB);
  if (!meB.data?.id) throw new Error(`getMe failed for ${emailB}`);

  const created = await createConversation(request, tokenA, meB.data.id);
  if (!created.data?.id) {
    throw new Error(`createConversation failed: ${created.status} ${created.errorCode}`);
  }

  if (options?.seedMessage) {
    const fromA = (options.seedFrom ?? "A") === "A";
    await sendMessage(
      request,
      fromA ? tokenA : tokenB,
      created.data.id,
      options.seedMessage,
    );
  }

  const meA = await getMe(request, tokenA);
  return {
    conversationId: created.data.id,
    tokenA,
    tokenB,
    userAId: meA.data!.id,
    userBId: meB.data.id,
    partnerNameB: meB.data.name ?? null,
  };
}
