import { apiFetch } from './client';

export type EventLocation = {
  id: string;
  invitationId: string;
  address: string;
  placeName: string;
  detailAddress: string;
  lat: number;
  lng: number;
  placeId: string;
};

export type ParticipantLocation = {
  id: string;
  participantId: string;
  lat: number;
  lng: number;
  accuracy: number;
  isArrived: boolean;
};

export function fetchEventLocation(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<EventLocation>(`/invitations/${invitationId}/location`, {
    signal: opts.signal,
  });
}

export const locationKeys = {
  eventLocation: (id: string) => ['locations', 'event', id] as const,
};
