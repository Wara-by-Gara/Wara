/**
 * 트랙 A — 실시간 마커 동기화 회귀 방지 (그룹 2 P0)
 *
 * 검증 대상:
 * - PR-A2: deleteEventLocation 시 Redis hash 일괄 삭제 → 후속 GET 빈 결과
 * - PR-A2/A3: stopMyLocationSharing / leave / kick / 회원탈퇴 시 location:removed broadcast
 * - 기존: 도착 감지 (justArrived=true) + 중복 도착 방지 (NX)
 */
import { test, expect } from "./fixtures";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  deleteEventLocation,
  deleteMyAccount,
  getMyParticipant,
  getParticipantLocations,
  leaveOrKickParticipant,
  offsetLatLng,
  setupLocationInvitation,
  stopMyLocationSharing,
  updateMyLocation,
  updateRsvp,
} from "./location-flow-api";
import { minutesFromNow } from "./location-flow-api";
import {
  createLocationSocket,
  disconnect,
  subscribeToInvitation,
  waitForConnect,
  waitForEvent,
} from "./location-ws-helpers";
import type { Socket } from "socket.io-client";

/** 관찰자 게스트가 WS subscribe하고 location:removed 수신할 준비를 마침 */
async function setupObserverSubscribed(token: string, invitationId: string): Promise<Socket> {
  const socket = createLocationSocket(token);
  await waitForConnect(socket);
  const sub = await subscribeToInvitation(socket, invitationId);
  if (!sub.ok) {
    disconnect(socket);
    throw new Error(`observer subscribe failed: ${sub.error}`);
  }
  return socket;
}

type LocationRemovedPayload = { invitationId: string; participantId: string };

test.describe("위치 공유 · 실시간 마커 동기화 (그룹 2)", () => {
  test("LOC-RT-05 · deleteEventLocation 후 GET /participant/locations → 빈 결과", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // 게스트 attending + GPS 한 번 update → Redis에 entry 생김
    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    await updateRsvp(
      request,
      guestToken,
      fx.invitationId,
      me.data!.participant.id,
      "attending",
    );
    const upd = await updateMyLocation(request, guestToken, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    expect(upd.status).toBe(200);

    // entry 있음 확인
    const before = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(before.status).toBe(200);
    expect(before.data?.length ?? 0).toBeGreaterThan(0);

    // 호스트가 event location 삭제 → Redis hash 일괄 삭제
    const del = await deleteEventLocation(request, fx.hostToken, fx.invitationId);
    expect(del.status).toBe(204);

    // 후속 GET → 빈 결과
    const after = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(after.status).toBe(200);
    expect(after.data ?? []).toEqual([]);
  });

  test("LOC-RT-06 · 이벤트 위치 반경 10m 진입 시 justArrived=true", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    await updateRsvp(
      request,
      guestToken,
      fx.invitationId,
      me.data!.participant.id,
      "attending",
    );

    // 반경 5m 안쪽 좌표로 update (10m 임계값 내부)
    const inside = offsetLatLng(DEFAULT_VENUE, 5, 0);
    const upd = await updateMyLocation(request, guestToken, fx.invitationId, inside);
    expect(upd.status).toBe(200);
    expect(upd.data?.justArrived).toBe(true);
    expect(upd.data?.location.isArrived).toBe(true);
  });

  test("LOC-RT-07 · 도착 후 같은 위치 재update는 justArrived=false (중복 방지)", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    await updateRsvp(
      request,
      guestToken,
      fx.invitationId,
      me.data!.participant.id,
      "attending",
    );

    const inside = offsetLatLng(DEFAULT_VENUE, 5, 0);
    const first = await updateMyLocation(request, guestToken, fx.invitationId, inside);
    expect(first.data?.justArrived).toBe(true);

    // 두 번째 update — claimArrival NX로 차단 → justArrived=false
    const second = await updateMyLocation(request, guestToken, fx.invitationId, inside);
    expect(second.status).toBe(200);
    expect(second.data?.justArrived).toBe(false);
    // 그러나 위치는 여전히 도착 상태 유지
    expect(second.data?.location.isArrived).toBe(true);
  });
});

test.describe("위치 공유 · location:removed broadcast (그룹 2 WS)", () => {
  let observerSocket: Socket | undefined;

  test.afterEach(() => {
    disconnect(observerSocket);
    observerSocket = undefined;
  });

  test("LOC-RT-01 · stopMyLocationSharing → 다른 참여자에게 location:removed", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const [g1Token, g2Token] = fx.guestTokens;

    // 두 게스트 모두 attending
    for (const t of [g1Token!, g2Token!]) {
      const me = await getMyParticipant(request, t, fx.invitationId);
      await updateRsvp(request, t, fx.invitationId, me.data!.participant.id, "attending");
    }

    // guest1 GPS update로 Redis entry 생성
    await updateMyLocation(request, g1Token!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });

    // guest2가 observer로 subscribe
    observerSocket = await setupObserverSubscribed(g2Token!, fx.invitationId);
    const removedPromise = waitForEvent<LocationRemovedPayload>(
      observerSocket,
      "location:removed",
      8000,
    );

    // guest1이 본인 공유 종료
    const stop = await stopMyLocationSharing(request, g1Token!, fx.invitationId);
    expect([200, 204]).toContain(stop.status);

    const payload = await removedPromise;
    expect(payload.invitationId).toBe(fx.invitationId);
    expect(typeof payload.participantId).toBe("string");
  });

  test("LOC-RT-03 · participant leave → location:removed", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const [g1Token, g2Token] = fx.guestTokens;

    for (const t of [g1Token!, g2Token!]) {
      const me = await getMyParticipant(request, t, fx.invitationId);
      await updateRsvp(request, t, fx.invitationId, me.data!.participant.id, "attending");
    }
    await updateMyLocation(request, g1Token!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });

    const g1Me = await getMyParticipant(request, g1Token!, fx.invitationId);
    const g1ParticipantId = g1Me.data!.participant.id;

    observerSocket = await setupObserverSubscribed(g2Token!, fx.invitationId);
    const removedPromise = waitForEvent<LocationRemovedPayload>(
      observerSocket,
      "location:removed",
      8000,
    );

    // guest1 본인 leave
    const leave = await leaveOrKickParticipant(
      request,
      g1Token!,
      fx.invitationId,
      g1ParticipantId,
    );
    expect([200, 204]).toContain(leave.status);

    const payload = await removedPromise;
    expect(payload.participantId).toBe(g1ParticipantId);
  });

  test("LOC-RT-04 · HOST kick → location:removed", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const [g1Token, g2Token] = fx.guestTokens;

    for (const t of [g1Token!, g2Token!]) {
      const me = await getMyParticipant(request, t, fx.invitationId);
      await updateRsvp(request, t, fx.invitationId, me.data!.participant.id, "attending");
    }
    await updateMyLocation(request, g1Token!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });

    const g1Me = await getMyParticipant(request, g1Token!, fx.invitationId);
    const g1ParticipantId = g1Me.data!.participant.id;

    observerSocket = await setupObserverSubscribed(g2Token!, fx.invitationId);
    const removedPromise = waitForEvent<LocationRemovedPayload>(
      observerSocket,
      "location:removed",
      8000,
    );

    // HOST가 guest1 kick
    const kick = await leaveOrKickParticipant(
      request,
      fx.hostToken,
      fx.invitationId,
      g1ParticipantId,
    );
    expect([200, 204]).toContain(kick.status);

    const payload = await removedPromise;
    expect(payload.participantId).toBe(g1ParticipantId);
  });

  test("LOC-RT-02 · 회원 탈퇴 → location:removed", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const [g1Token, g2Token] = fx.guestTokens;

    for (const t of [g1Token!, g2Token!]) {
      const me = await getMyParticipant(request, t, fx.invitationId);
      await updateRsvp(request, t, fx.invitationId, me.data!.participant.id, "attending");
    }
    await updateMyLocation(request, g1Token!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });

    observerSocket = await setupObserverSubscribed(g2Token!, fx.invitationId);
    const removedPromise = waitForEvent<LocationRemovedPayload>(
      observerSocket,
      "location:removed",
      10000,
    );

    // guest1 회원 탈퇴 (호스트 권한 없는 게스트라 차단 없이 진행)
    const del = await deleteMyAccount(request, g1Token!);
    expect([200, 204]).toContain(del.status);

    const payload = await removedPromise;
    expect(payload.invitationId).toBe(fx.invitationId);
  });
});
