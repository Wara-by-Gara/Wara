/**
 * 트랙 A — 실시간 마커 동기화 회귀 방지 (그룹 2 P0)
 *
 * REST로 검증 가능한 시나리오만 작성. WS broadcast(location:removed 등)는
 * socket.io-client 헬퍼 부재로 후속 PR에서 보강.
 *
 * 검증 대상:
 * - PR-A2: deleteEventLocation 시 Redis hash 일괄 삭제 → 후속 GET 빈 결과
 * - 기존: 도착 감지 (justArrived=true)
 * - 기존: 중복 도착 방지 (두 번째 update에선 justArrived=false)
 */
import { test, expect } from "./fixtures";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  deleteEventLocation,
  getMyParticipant,
  getParticipantLocations,
  offsetLatLng,
  setupLocationInvitation,
  updateMyLocation,
  updateRsvp,
} from "./location-flow-api";
import { minutesFromNow } from "./location-flow-api";

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
