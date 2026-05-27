import { apiGet, apiPost } from "./client";

export interface MissionTemplate {
  id: string;
  content: string;
}

export function getMissionTemplates(): Promise<MissionTemplate[]> {
  return apiGet<MissionTemplate[]>("/missions/templates");
}

export function createMission(
  invitationId: string,
  payload: { templateId?: string; content?: string },
): Promise<{ id: string; content: string }> {
  return apiPost(`/invitations/${invitationId}/missions`, payload);
}
