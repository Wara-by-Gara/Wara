import type { APIRequestContext } from "@playwright/test";
import {
  apiCall,
  createInvitation,
  devToken,
  joinInvitation,
  uniqueTitle,
  VOTE_HOST_EMAIL,
} from "./vote-flow-api";

export { devToken, createInvitation, joinInvitation, uniqueTitle };

export const LOC_HOST_EMAIL = VOTE_HOST_EMAIL;
export const LOC_GUEST_EMAILS = [
  "guest001@wara.dev",
  "guest002@wara.dev",
  "guest003@wara.dev",
  "guest004@wara.dev",
  "guest005@wara.dev",
] as const;

/** 강남역 부근 — E2E 기본 모임 장소 */
export const DEFAULT_VENUE = {
  placeName: "E2E 강남역",
  address: "서울 강남구 강남대로 396",
  lat: 37.4979,
  lng: 127.0276,
  placeId: "e2e-gangnam",
};

export type VenueInput = typeof DEFAULT_VENUE;

export function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/** base에서 bearing(0=북) 방향으로 distanceMeters만큼 이동한 좌표 */
export function offsetLatLng(
  base: { lat: number; lng: number },
  distanceMeters: number,
  bearingDegrees = 0,
): { lat: number; lng: number } {
  const R = 6_371_000;
  const brng = (bearingDegrees * Math.PI) / 180;
  const lat1 = (base.lat * Math.PI) / 180;
  const lng1 = (base.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
      Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distanceMeters / R) * Math.cos(lat1),
      Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

export async function setEventLocation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
  venue: VenueInput = DEFAULT_VENUE,
) {
  return apiCall<{
    placeName: string;
    lat: number;
    lng: number;
  }>(request, token, "PUT", `/invitations/${invitationId}/location`, {
    address: venue.address,
    placeName: venue.placeName,
    detailAddress: "",
    lat: venue.lat,
    lng: venue.lng,
    placeId: venue.placeId,
  });
}

export async function getEventLocation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{ placeName: string; lat: number; lng: number }>(
    request,
    token,
    "GET",
    `/invitations/${invitationId}/location`,
  );
}

export async function deleteEventLocation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  const res = await request.fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/invitations/${invitationId}/location`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
      },
    },
  );
  return { status: res.status() };
}

export type ParticipantLocationRow = {
  participantId: string;
  lat: number;
  lng: number;
  isArrived: boolean;
  nickname: string | null;
};

export async function getParticipantLocations(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<ParticipantLocationRow[]>(
    request,
    token,
    "GET",
    `/invitations/${invitationId}/participant/locations`,
  );
}

export async function updateMyLocation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
  coords: { lat: number; lng: number; accuracy?: number },
) {
  return apiCall<{
    location: { isArrived: boolean; lat: number; lng: number; participantId: string };
    justArrived: boolean;
  }>(request, token, "PUT", `/invitations/${invitationId}/participant/me/location`, {
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy ?? 5,
  });
}

export async function getParticipants(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{
    participants: { participant: { id: string; memberRole: string }; user: { id: string } }[];
  }>(request, token, "GET", `/invitations/${invitationId}/participants`);
}

export async function nudgeParticipant(
  request: APIRequestContext,
  hostToken: string,
  invitationId: string,
  participantId: string,
) {
  const API = `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api`;
  const res = await request.post(
    `${API}/invitations/${invitationId}/participants/${participantId}/nudge`,
    {
      headers: {
        Authorization: `Bearer ${hostToken}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
      },
    },
  );
  return { status: res.status() };
}

export type NotificationRow = { type: string; invitationId: string | null; content: string };

export async function getNotifications(
  request: APIRequestContext,
  token: string,
  limit = 50,
) {
  return apiCall<{ items: NotificationRow[] }>(
    request,
    token,
    "GET",
    `/notifications?limit=${limit}`,
  );
}

/** 본인 participant 정보 조회 — RSVP 변경에 participantId 필요 */
export async function getMyParticipant(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{ participant: { id: string; rsvpStatus: string; memberRole: string } }>(
    request,
    token,
    "GET",
    `/invitations/${invitationId}/participants/me`,
  );
}

export async function updateRsvp(
  request: APIRequestContext,
  token: string,
  invitationId: string,
  participantId: string,
  rsvpStatus: "attending" | "undecided" | "absent",
) {
  return apiCall<{ id: string; rsvpStatus: string }>(
    request,
    token,
    "PATCH",
    `/invitations/${invitationId}/participants/${participantId}/rsvp`,
    { rsvpStatus },
  );
}

export async function closeInvitation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  return apiCall<{ id: string; status: string }>(
    request,
    token,
    "PATCH",
    `/invitations/${invitationId}`,
    { status: "closed" },
  );
}

/** invitation soft delete (host) */
export async function softDeleteInvitation(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  const res = await request.fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/invitations/${invitationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
      },
    },
  );
  return { status: res.status() };
}

/** participant leave 또는 host kick (둘 다 DELETE /participants/:id) */
export async function leaveOrKickParticipant(
  request: APIRequestContext,
  token: string,
  invitationId: string,
  participantId: string,
) {
  const res = await request.fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/invitations/${invitationId}/participants/${participantId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
      },
    },
  );
  return { status: res.status() };
}

/** 본인 GPS 공유 즉시 종료 */
export async function stopMyLocationSharing(
  request: APIRequestContext,
  token: string,
  invitationId: string,
) {
  const res = await request.fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/invitations/${invitationId}/participant/me/location`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
      },
    },
  );
  return { status: res.status() };
}

/** 회원 탈퇴 */
export async function deleteMyAccount(
  request: APIRequestContext,
  token: string,
) {
  const res = await request.fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/users/me`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({}),
    },
  );
  return { status: res.status() };
}

export async function processPreEventNotifications(request: APIRequestContext) {
  const API = `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api`;
  const res = await request.post(`${API}/dev/location/process-pre-event`, {
    headers: { Origin: process.env.E2E_WEB_URL ?? "http://localhost:3000" },
  });
  const body = (await res.json().catch(() => ({}))) as { data?: { ok?: boolean } };
  return { status: res.status(), ok: body.data?.ok ?? false };
}

export async function setupLocationInvitation(
  request: APIRequestContext,
  options?: {
    eventStartAt?: string | null;
    guestEmails?: string[];
    venue?: VenueInput;
    skipLocation?: boolean;
  },
) {
  const hostToken = await devToken(request, LOC_HOST_EMAIL);
  const inv = await createInvitation(request, hostToken, uniqueTitle("E2E Loc"), {
    eventStartAt: options?.eventStartAt ?? minutesFromNow(10),
  });
  if (inv.status !== 201 || !inv.data) {
    throw new Error(`createInvitation failed: ${inv.status} ${inv.errorCode}`);
  }

  const invitationId = inv.data.id;
  if (!options?.skipLocation) {
    const loc = await setEventLocation(
      request,
      hostToken,
      invitationId,
      options?.venue ?? DEFAULT_VENUE,
    );
    if (loc.status !== 200 && loc.status !== 201) {
      throw new Error(`setEventLocation failed: ${loc.status} ${loc.errorCode}`);
    }
  }

  const guestEmails = options?.guestEmails ?? [LOC_GUEST_EMAILS[0]!];
  const guestTokens: string[] = [];
  for (const email of guestEmails) {
    const guestToken = await devToken(request, email);
    const joined = await joinInvitation(request, guestToken, invitationId);
    if (joined.status !== 201 && joined.status !== 200) {
      throw new Error(`join failed ${email}: ${joined.status} ${joined.errorCode}`);
    }
    guestTokens.push(guestToken);
  }

  return { hostToken, guestTokens, invitationId, venue: options?.venue ?? DEFAULT_VENUE };
}
