import { apiGet, apiPut, apiDelete } from "./client";

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

export interface SetEventLocationPayload {
  address: string;
  placeName: string;
  detailAddress?: string;
  lat: number;
  lng: number;
  placeId: string;
}

export interface ParticipantLocation {
  id: string;
  participantId: string;
  lat: number;
  lng: number;
  accuracy: number;
  isArrived: boolean;
}

export interface UpdateMyLocationPayload {
  lat: number;
  lng: number;
  accuracy: number;
  isArrived?: boolean;
}

export interface Place {
  placeId: string;
  placeName: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
  placeUrl: string;
  distance: number | null;
}

export interface PlaceSearchResponse {
  places: Place[];
  meta: {
    totalCount: number;
    pageableCount: number;
    isEnd: boolean;
  };
}

export function getEventLocation(invitationId: string, token: string): Promise<EventLocation> {
  return apiGet<EventLocation>(`/invitations/${invitationId}/location`, token);
}

export function setEventLocation(
  invitationId: string,
  payload: SetEventLocationPayload,
  token: string,
): Promise<EventLocation> {
  return apiPut<EventLocation>(`/invitations/${invitationId}/location`, payload, token);
}

export function deleteEventLocation(invitationId: string, token: string): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/location`, token);
}

export function getParticipantLocations(
  invitationId: string,
  token: string,
): Promise<ParticipantLocation[]> {
  return apiGet<ParticipantLocation[]>(`/invitations/${invitationId}/participant/locations`, token);
}

export function updateMyLocation(
  invitationId: string,
  payload: UpdateMyLocationPayload,
  token: string,
): Promise<ParticipantLocation> {
  return apiPut<ParticipantLocation>(
    `/invitations/${invitationId}/participant/me/location`,
    payload,
    token,
  );
}

export function searchPlaces(
  query: string,
  page = 1,
  size = 15,
): Promise<PlaceSearchResponse> {
  const params = new URLSearchParams({ query, page: String(page), size: String(size) });
  return apiGet<PlaceSearchResponse>(`/locations/search?${params}`);
}
