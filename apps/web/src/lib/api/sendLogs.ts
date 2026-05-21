import { apiPost } from "./client";

type Channel = "kakao" | "sms" | "link" | "email" | "dm" | "instagram";

interface CreateSendLogPayload {
  channel: Channel;
}

interface SendLogResponse {
  inviteUrl: string;
  smsUri?: string;
}

export function createSendLog(
  invitationId: string,
  payload: CreateSendLogPayload,
  token: string,
): Promise<SendLogResponse> {
  return apiPost<SendLogResponse>(
    `/invitations/${invitationId}/logs`,
    payload,
    token,
  );
}
