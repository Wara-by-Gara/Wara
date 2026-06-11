/**
 * 트랙 A — 위치 공유 개인정보 정책 회귀 방지 (그룹 1 P0)
 *
 * 검증 대상:
 * - PR-A3: absent 게스트 GPS 열람 차단 (RSVP_PERMISSION_DENIED)
 * - PR-A3: closed 초대장 GPS upsert 차단 (INVITATION_CLOSED)
 * - 기준 positive: attending 게스트는 통과
 *
 * WS·로그 redact 시나리오는 socket 헬퍼·log inspect 인프라가 별도라 후속 PR로.
 */
import { test, expect } from "./fixtures";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  closeInvitation,
  getMyParticipant,
  getParticipantLocations,
  setupLocationInvitation,
  updateMyLocation,
  updateRsvp,
} from "./location-flow-api";

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
});
