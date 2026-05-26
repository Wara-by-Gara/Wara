import { apiGet, apiPost } from "./client";

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
}

export interface CreatedInvitation {
  id: string;
  title: string;
}

export interface Invitation {
  id: string;
  userId: string;
  templateId: string | null;
  status: string;
  title: string;
  description: string;
  mainImageKey: string;
  mainImageUrl: string;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  eventLocation: EventLocation | null;
}

export interface EventLocation {
  id: string;
  invitationId: string;
  address: string;
  placeName: string;
  detailAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  createdAt: string;
  updatedAt: string;
}

export function createInvitation(payload: CreateInvitationPayload): Promise<CreatedInvitation> {
  return apiPost<CreatedInvitation>("/invitations", payload);
}

export function getInvitation(id: string): Promise<Invitation> {
  return apiGet<Invitation>(`/invitations/${id}`);
}

export interface MyInvitation {
  id: string;
  role: 'HOST' | 'GUEST';
  title: string;
  mainImageUrl: string;
  eventStartAt: string | null;
  status: string;
}

export function getMyInvitations(token: string): Promise<MyInvitation[]> {
  return apiGet<MyInvitation[]>('/invitations', token);
}
