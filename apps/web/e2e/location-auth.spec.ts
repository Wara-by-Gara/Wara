/**
 * 트랙 A — 위치 공유 권한 & 접근 제어 회귀 방지 (그룹 3 P0)
 *
 * 검증 대상:
 * - LOC-AUTH-01: 토큰 없는 WS 연결 → 서버에서 즉시 disconnect
 * - LOC-AUTH-02: 위조/만료 토큰 WS 연결 → 즉시 disconnect (verifyAsync 실패)
 * - LOC-AUTH-03: 다른 초대장 room broadcast 격리 (미가입자 미수신)
 * - LOC-AUTH-04: blocklist 사용자 REST → 403 INVITATION_ACCESS_REVOKED
 * - LOC-AUTH-05: 비-HOST nudge → 403 INSUFFICIENT_ROLE
 * - LOC-AUTH-06: 비-HOST deleteEventLocation → 403 INSUFFICIENT_ROLE
 */
import { test, expect } from "./fixtures";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  deleteEventLocation,
  getMyParticipant,
  getParticipantLocations,
  leaveOrKickParticipant,
  minutesFromNow,
  nudgeParticipant,
  setupLocationInvitation,
  stopMyLocationSharing,
  updateMyLocation,
  updateRsvp,
} from "./location-flow-api";
import {
  createLocationSocket,
  disconnect,
  expectNoEvent,
  subscribeToInvitation,
  waitForConnect,
  waitForServerDisconnect,
} from "./location-ws-helpers";
import type { Socket } from "socket.io-client";

test.describe("위치 공유 · WS 인증 (그룹 3)", () => {
  let socket: Socket | undefined;

  test.afterEach(() => {
    disconnect(socket);
    socket = undefined;
  });

  test("LOC-AUTH-01 · 토큰 없이 WS 연결 → 서버 즉시 disconnect", async () => {
    socket = createLocationSocket("");

    // 서버는 handshake에서 token 추출 실패 → catch → client.disconnect().
    // 클라이언트는 connect_error 또는 connect 직후 disconnect 중 하나로 종료.
    await expect(waitForServerDisconnect(socket, 3000)).resolves.toMatchObject({
      reason: expect.stringMatching(/^(connect_error|disconnect)$/),
    });
    expect(socket.connected).toBe(false);
  });

  test("LOC-AUTH-02 · 위조된 토큰으로 WS 연결 → 서버 즉시 disconnect", async () => {
    // verifyAsync가 throw하는 임의 문자열. 만료/위조/형식 불량 모두 동일 분기(disconnect)로 가드.
    socket = createLocationSocket("invalid.jwt.token");

    await expect(waitForServerDisconnect(socket, 3000)).resolves.toMatchObject({
      reason: expect.stringMatching(/^(connect_error|disconnect)$/),
    });
    expect(socket.connected).toBe(false);
  });
});

test.describe("위치 공유 · WS room 격리 (그룹 3)", () => {
  let socket: Socket | undefined;

  test.afterEach(() => {
    disconnect(socket);
    socket = undefined;
  });

  test("LOC-AUTH-03 · 다른 초대장 room broadcast는 미가입자에게 전달되지 않음", async ({
    request,
  }) => {
    // 같은 호스트가 두 초대장 X, Y 생성. G1은 X에만, G2는 Y에만 참여.
    const fxX = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const fxY = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[1]!],
    });
    const g1Token = fxX.guestTokens[0]!;
    const g2Token = fxY.guestTokens[0]!;

    // G2: Y에서 attending + GPS update → Y room에 entry 생성
    const g2Me = await getMyParticipant(request, g2Token, fxY.invitationId);
    await updateRsvp(
      request,
      g2Token,
      fxY.invitationId,
      g2Me.data!.participant.id,
      "attending",
    );
    await updateMyLocation(request, g2Token, fxY.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });

    // G1: X에만 subscribe
    socket = createLocationSocket(g1Token);
    await waitForConnect(socket);
    const sub = await subscribeToInvitation(socket, fxX.invitationId);
    expect(sub.ok).toBe(true);

    // 일정 시간 동안 location:removed 미수신 검증과 동시에 Y에서 stop trigger
    const noEventPromise = expectNoEvent(socket, "location:removed", 2500);
    const stop = await stopMyLocationSharing(request, g2Token, fxY.invitationId);
    expect([200, 204]).toContain(stop.status);

    await expect(noEventPromise).resolves.toBeUndefined();
  });
});

test.describe("위치 공유 · REST 권한 (그룹 3)", () => {
  test("LOC-AUTH-04 · HOST가 kick한 사용자는 GET /participant/locations → 403 INVITATION_ACCESS_REVOKED", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    const participantId = me.data!.participant.id;

    // HOST kick → blocklist 자동 추가 (participants.service.ts:141)
    const kick = await leaveOrKickParticipant(
      request,
      fx.hostToken,
      fx.invitationId,
      participantId,
    );
    expect([200, 204]).toContain(kick.status);

    // 차단된 사용자가 location 관련 endpoint 호출 → BlocklistGuard에서 차단
    const got = await getParticipantLocations(request, guestToken, fx.invitationId);
    expect(got.status).toBe(403);
    expect(got.errorCode).toBe("INVITATION_ACCESS_REVOKED");
  });

  test("LOC-AUTH-05 · 비-HOST가 nudge 호출 → 403 INSUFFICIENT_ROLE", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const [g1Token, g2Token] = fx.guestTokens;

    // 같은 초대장에 함께 참여한 g2의 participantId를 대상으로 g1이 nudge 시도
    const g2Me = await getMyParticipant(request, g2Token!, fx.invitationId);
    const g2ParticipantId = g2Me.data!.participant.id;

    const res = await nudgeParticipant(
      request,
      g1Token!,
      fx.invitationId,
      g2ParticipantId,
    );
    expect(res.status).toBe(403);
    expect(res.errorCode).toBe("INSUFFICIENT_ROLE");
  });

  test("LOC-AUTH-06 · 비-HOST가 deleteEventLocation 호출 → 403 INSUFFICIENT_ROLE", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(10),
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    const res = await deleteEventLocation(request, guestToken, fx.invitationId);
    expect(res.status).toBe(403);
    expect(res.errorCode).toBe("INSUFFICIENT_ROLE");
  });
});
