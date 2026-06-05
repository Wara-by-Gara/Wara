import { apiPatch, apiPost } from "./client";

type CreateSendLogPayload = {
  channel: "kakao" | "link" | "sms" | "email" | "dm" | "instagram";
};

interface SendLogResponse {
  inviteUrl: string;
  smsUri?: string;
}

export function createSendLog(
  invitationId: string,
  payload: CreateSendLogPayload,
): Promise<SendLogResponse> {
  return apiPost<SendLogResponse>(
    `/invitations/${invitationId}/logs`,
    payload,
  );
}

export function recordLogOpen(invitationId: string, logId: string): Promise<void> {
  return apiPatch<void>(`/invitations/${invitationId}/logs/${logId}/open`, {});
}

export function recordLogJoined(invitationId: string, logId: string): Promise<void> {
  return apiPatch<void>(`/invitations/${invitationId}/logs/${logId}/joined`, {});
}
