import { apiFetch } from './client';

export interface MobilePhoto {
  id: string;
  participantId: string;
  invitationId: string;
  imageKey: string;
  likeCount: number;
  feedbackCount: number;
  url: string;
  createdAt: string;
  takenAt: string | null;
}

export interface MobilePhotoLocation extends MobilePhoto {
  gpsLat: number;
  gpsLng: number;
}

export function fetchMyPhotoLocations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<MobilePhotoLocation[]>('/photos/locations', { signal: opts.signal });
}

export const photoKeys = {
  myLocations: ['photos', 'locations'] as const,
};
