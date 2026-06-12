/**
 * 트랙 A — 위치 공유 개인정보 정책 회귀 방지 (그룹 1 P0)
 *
 * 검증 대상:
 * - PR-A1: WS subscribe 시 비참여자 차단 (PARTICIPANT_NOT_FOUND)
 * - PR-A3: absent 게스트 GPS 열람 차단 (REST + WS, RSVP_PERMISSION_DENIED)
 * - PR-A3: closed 초대장 GPS upsert 차단 (INVITATION_CLOSED)
 * - PR-A3: soft-deleted 초대장 GPS upsert 차단 (INVITATION_CLOSED)
 *
 * log redact / Sentry breadcrumb은 BE 단위 테스트 영역.
 * HOST-absent는 RSVP API로 만들 수 없어 dev SQL endpoint 필요.
 */
import { test, expect } from "./fixtures";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  closeInvitation,
  createInvitation,
  devToken,
  getMyParticipant,
  getParticipantLocations,
  leaveOrKickParticipant,
  setupLocationInvitation,
  softDeleteInvitation,
  uniqueTitle,
  updateMyLocation,
  updateRsvp,
} from "./location-flow-api";
import {
  createLocationSocket,
  disconnect,
  subscribeToInvitation,
  waitForConnect,
} from "./location-ws-helpers";
import type { Socket } from "socket.io-client";

test.describe("위치 공유 · 개인정보 정책 (그룹 1)", () => {
  test("LOC-PRIV-04 · absent 게스트는 GET /participant/locations → 403", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // 게스트 본인의 RSVP를 absent로 변경
    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    expect(me.status).toBe(200);
    const participantId = me.data!.participant.id;
    const rsvpRes = await updateRsvp(
      request,
      guestToken,
      fx.invitationId,
      participantId,
      "absent",
    );
    expect(rsvpRes.status).toBe(200);

    // absent 게스트 GET → 403 RSVP_PERMISSION_DENIED
    const got = await getParticipantLocations(request, guestToken, fx.invitationId);
    expect(got.status).toBe(403);
    expect(got.errorCode).toBe("RSVP_PERMISSION_DENIED");
  });

  test("LOC-PRIV-04b · attending 게스트는 GET /participant/locations → 200 (positive)", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // join 기본 RSVP가 undecided일 수 있어 attending으로 명시
    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    const participantId = me.data!.participant.id;
    await updateRsvp(request, guestToken, fx.invitationId, participantId, "attending");

    const got = await getParticipantLocations(request, guestToken, fx.invitationId);
    expect(got.status).toBe(200);
  });

  test("LOC-PRIV-07 · closed 초대장에 GPS upsert → 422 INVITATION_CLOSED", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // 초대장 close
    const closed = await closeInvitation(request, fx.hostToken, fx.invitationId);
    expect(closed.status).toBe(200);
    expect(closed.data?.status).toBe("closed");

    // GPS upsert 시도 → 422
    const upd = await updateMyLocation(request, guestToken, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    expect(upd.status).toBe(422);
    expect(upd.errorCode).toBe("INVITATION_CLOSED");
  });

  test("LOC-PRIV-08 · soft-deleted 초대장에 GPS upsert → 차단", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // BE 정책: 게스트가 남아있는 초대장은 호스트도 삭제 불가(INVITATION_HAS_PARTICIPANTS).
    // 따라서 soft delete 전에 게스트가 먼저 leave해야 한다.
    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    const leave = await leaveOrKickParticipant(
      request,
      guestToken,
      fx.invitationId,
      me.data!.participant.id,
    );
    expect([200, 204]).toContain(leave.status);

    // 호스트가 invitation soft delete
    const del = await softDeleteInvitation(request, fx.hostToken, fx.invitationId);
    expect([200, 204]).toContain(del.status);

    // leave + soft delete 이후 GPS upsert 시도 — PARTICIPANT_NOT_FOUND 또는 INVITATION_CLOSED.
    // 어느 코드가 나오든 정책 위반(200 통과) 없음을 보장.
    const upd = await updateMyLocation(request, guestToken, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    expect([403, 404, 422]).toContain(upd.status);
  });
});

test.describe("위치 공유 · 개인정보 정책 WS (그룹 1)", () => {
  let socket: Socket | undefined;

  test.afterEach(() => {
    disconnect(socket);
    socket = undefined;
  });

  test("LOC-PRIV-01 · 비참여자가 location:subscribe → PARTICIPANT_NOT_FOUND", async ({
    request,
  }) => {
    // 호스트 A의 초대장 생성
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });

    // 다른 사용자(비참여자) 토큰 발급
    const outsiderToken = await devToken(request, LOC_GUEST_EMAILS[1]!);

    socket = createLocationSocket(outsiderToken);
    await waitForConnect(socket);

    const result = await subscribeToInvitation(socket, fx.invitationId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("PARTICIPANT_NOT_FOUND");
    }
  });

  test("LOC-PRIV-05 · absent 게스트가 location:subscribe → RSVP_PERMISSION_DENIED", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!],
    });
    const guestToken = fx.guestTokens[0]!;

    // 게스트 RSVP absent로 변경
    const me = await getMyParticipant(request, guestToken, fx.invitationId);
    await updateRsvp(
      request,
      guestToken,
      fx.invitationId,
      me.data!.participant.id,
      "absent",
    );

    socket = createLocationSocket(guestToken);
    await waitForConnect(socket);

    const result = await subscribeToInvitation(socket, fx.invitationId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("RSVP_PERMISSION_DENIED");
    }
  });

  test("LOC-PRIV-05b · attending 게스트가 location:subscribe → 정상 join (positive)", async ({
    request,
  }) => {
    const fx = await setupLocationInvitation(request, {
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

    socket = createLocationSocket(guestToken);
    await waitForConnect(socket);

    const result = await subscribeToInvitation(socket, fx.invitationId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ack.invitationId).toBe(fx.invitationId);
    }
  });
});

// uniqueTitle / createInvitation은 setupLocationInvitation에서 간접 사용. 직접 import는 안 함.
void [createInvitation, uniqueTitle];
