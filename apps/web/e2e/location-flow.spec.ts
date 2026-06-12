import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { authFile } from "./personas";
import {
  DEFAULT_VENUE,
  LOC_GUEST_EMAILS,
  LOC_HOST_EMAIL,
  getEventLocation,
  getNotifications,
  getParticipantLocations,
  getParticipants,
  minutesFromNow,
  nudgeParticipant,
  offsetLatLng,
  processPreEventNotifications,
  setEventLocation,
  setupLocationInvitation,
  updateMyLocation,
} from "./location-flow-api";
import { createInvitation, devToken, uniqueTitle } from "./location-flow-api";
import { gotoLocationMap, kstEndOfDayIso, mockBrowserTime } from "./helpers";

test.describe("위치 공유 · API (01–08, 09–26)", () => {
  test("01 · T+16분이면 GPS 윈도우 밖 (UI tracking inactive)", async ({ page }) => {
    const startAt = minutesFromNow(16);
    await mockBrowserTime(page, new Date().toISOString());
    const fx = await setupLocationInvitation(page.request, { eventStartAt: startAt });
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("inactive");
  });

  test("02 · T+14분이면 호스트 GPS 윈도우 활성", async ({ page }) => {
    const startAt = minutesFromNow(14);
    const fx = await setupLocationInvitation(page.request, { eventStartAt: startAt });
    await mockBrowserTime(page, new Date().toISOString());
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("active", {
      timeout: 15_000,
    });
  });

  test("03 · T+14분이면 게스트 GPS 윈도우 활성", async ({ browser, request }) => {
    const startAt = minutesFromNow(14);
    const fx = await setupLocationInvitation(request, { eventStartAt: startAt });
    const ctx = await browser.newContext({ storageState: authFile("guest") });
    const page = await ctx.newPage();
    await mockBrowserTime(page, new Date().toISOString());
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("active", {
      timeout: 15_000,
    });
    await ctx.close();
  });

  test("04 · process-pre-event 시 전원 invitation_date 알림", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      eventStartAt: minutesFromNow(14),
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const triggered = await processPreEventNotifications(request);
    expect(triggered.status).toBe(200);
    for (const token of [fx.hostToken, ...fx.guestTokens]) {
      const notes = await getNotifications(request, token);
      const hit = notes.data?.items?.some(
        (n) => n.type === "invitation_date" && n.invitationId === fx.invitationId,
      );
      expect(hit).toBe(true);
    }
  });

  test("05 · eventStartAt 없으면 tracking inactive", async ({ page }) => {
    const hostToken = await devToken(page.request, LOC_HOST_EMAIL);
    const inv = await createInvitation(page.request, hostToken, uniqueTitle("E2E NoDate"));
    expect(inv.status).toBe(201);
    await setEventLocation(page.request, hostToken, inv.data!.id);
    await gotoLocationMap(page, inv.data!.id);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("inactive");
  });

  test("06 · T+45분이면 tracking inactive", async ({ page }) => {
    const startAt = minutesFromNow(45);
    const fx = await setupLocationInvitation(page.request, { eventStartAt: startAt });
    await mockBrowserTime(page, new Date().toISOString());
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("inactive");
  });

  test("07 · 이미 시작한 모임(T-30분)은 tracking active", async ({ page }) => {
    const startAt = minutesFromNow(-30);
    const fx = await setupLocationInvitation(page.request, { eventStartAt: startAt });
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("active", {
      timeout: 15_000,
    });
  });

  test("08 · 당일 23:59(KST) 이후 tracking inactive", async ({ page }) => {
    const startAt = minutesFromNow(-120);
    const fx = await setupLocationInvitation(page.request, { eventStartAt: startAt });
    const afterEnd = new Date(new Date(kstEndOfDayIso(startAt)).getTime() + 60_000).toISOString();
    await mockBrowserTime(page, afterEnd);
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByTestId("location-tracking-active")).toHaveText("inactive");
  });

  test("09 · 호스트가 행사 장소를 등록한다", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const loc = await getEventLocation(request, fx.hostToken, fx.invitationId);
    expect(loc.status).toBe(200);
    expect(loc.data?.placeName).toBe(DEFAULT_VENUE.placeName);
  });

  test("10 · 게스트가 행사 장소를 조회한다", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const loc = await getEventLocation(request, fx.guestTokens[0]!, fx.invitationId);
    expect(loc.status).toBe(200);
    expect(loc.data?.lat).toBeCloseTo(DEFAULT_VENUE.lat, 4);
  });

  test("11 · 장소 미설정 시 LOCATION_NOT_FOUND", async ({ request }) => {
    const fx = await setupLocationInvitation(request, { skipLocation: true });
    const loc = await getEventLocation(request, fx.hostToken, fx.invitationId);
    expect(loc.status).toBe(404);
    expect(loc.errorCode).toBe("LOCATION_NOT_FOUND");
  });

  test("12 · 게스트는 행사 장소 PUT 불가", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const res = await setEventLocation(request, fx.guestTokens[0]!, fx.invitationId);
    expect(res.status).toBe(403);
  });

  test("13 · 게스트 1명 위치가 목록에 반영된다", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const away = offsetLatLng(DEFAULT_VENUE, 500, 90);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, away);
    const list = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(list.data?.length).toBe(1);
  });

  test("14 · 게스트 3명 서로 다른 좌표", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: LOC_GUEST_EMAILS.slice(0, 3) as unknown as string[],
    });
    const bearings = [0, 120, 240];
    for (let i = 0; i < 3; i++) {
      const pos = offsetLatLng(DEFAULT_VENUE, 300 + i * 50, bearings[i]!);
      await updateMyLocation(request, fx.guestTokens[i]!, fx.invitationId, pos);
    }
    const list = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(list.data?.length).toBe(3);
    const lats = new Set(list.data!.map((r) => r.lat.toFixed(5)));
    expect(lats.size).toBe(3);
  });

  test("15 · 게스트 3명 위치 일괄 반영", async ({ request }) => {
    const guests = LOC_GUEST_EMAILS.slice(0, 3);
    const fx = await setupLocationInvitation(request, {
      guestEmails: [...guests],
    });
    for (let i = 0; i < 3; i++) {
      const pos = offsetLatLng(DEFAULT_VENUE, 200 + i * 30, i * 72);
      await updateMyLocation(request, fx.guestTokens[i]!, fx.invitationId, pos);
    }
    const list = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(list.data?.length).toBe(3);
  });

  test("16 · 호스트 위치도 목록에 포함된다", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const hostPos = offsetLatLng(DEFAULT_VENUE, 400, 180);
    await updateMyLocation(request, fx.hostToken, fx.invitationId, hostPos);
    const list = await getParticipantLocations(request, fx.hostToken, fx.invitationId);
    expect(list.data?.some((r) => Math.abs(r.lat - hostPos.lat) < 0.0001)).toBe(true);
  });

  test("17 · A 업데이트 후 B가 최신 좌표를 본다", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const pos = offsetLatLng(DEFAULT_VENUE, 250, 45);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, pos);
    const list = await getParticipantLocations(request, fx.guestTokens[1]!, fx.invitationId);
    const row = list.data?.find((r) => Math.abs(r.lat - pos.lat) < 0.0001);
    expect(row).toBeTruthy();
  });

  test("18 · 비참가자는 participant/locations 거부", async ({ request }) => {
    const fx = await setupLocationInvitation(request, { guestEmails: [] });
    const outsider = await devToken(request, LOC_GUEST_EMAILS[0]!);
    const list = await getParticipantLocations(request, outsider, fx.invitationId);
    expect([403, 404]).toContain(list.status);
  });

  test("19 · 행사 좌표와 동일하면 isArrived true", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const res = await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    expect(res.data?.location.isArrived).toBe(true);
  });

  test("20 · 8m 이내면 isArrived true", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const near = offsetLatLng(DEFAULT_VENUE, 8, 0);
    const res = await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, near);
    expect(res.data?.location.isArrived).toBe(true);
  });

  test("21 · 15m 밖이면 isArrived false", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const far = offsetLatLng(DEFAULT_VENUE, 15, 0);
    const res = await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, far);
    expect(res.data?.location.isArrived).toBe(false);
  });

  test("22 · 도착 후 재 PUT 시 중복 arrived 알림 없음", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    await new Promise((r) => setTimeout(r, 11_000));
    const before = await getNotifications(request, fx.hostToken);
    const countBefore =
      before.data?.items?.filter((n) => n.type === "arrived").length ?? 0;
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    await new Promise((r) => setTimeout(r, 2_000));
    const after = await getNotifications(request, fx.hostToken);
    const countAfter =
      after.data?.items?.filter((n) => n.type === "arrived").length ?? 0;
    expect(countAfter).toBe(countBefore);
  });

  test("23 · 도착 10초 후 본인·호스트 arrived 알림", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, {
      lat: DEFAULT_VENUE.lat,
      lng: DEFAULT_VENUE.lng,
    });
    await new Promise((r) => setTimeout(r, 11_000));
    const guestNotes = await getNotifications(request, fx.guestTokens[0]!);
    const hostNotes = await getNotifications(request, fx.hostToken);
    expect(
      guestNotes.data?.items?.some((n) => n.type === "arrived" && n.content.includes("도착")),
    ).toBe(true);
    expect(
      hostNotes.data?.items?.some((n) => n.type === "arrived" && n.content.includes("도착")),
    ).toBe(true);
  });

  test("25 · 호스트 nudge API", async ({ request }) => {
    const fx = await setupLocationInvitation(request);
    const parts = await getParticipants(request, fx.hostToken, fx.invitationId);
    const guestPart = parts.data?.participants.find(
      (p) => p.participant.memberRole !== "HOST",
    );
    expect(guestPart).toBeTruthy();
    const res = await nudgeParticipant(
      request,
      fx.hostToken,
      fx.invitationId,
      guestPart!.participant.id,
    );
    expect(res.status).toBe(204);
    const notes = await getNotifications(request, fx.guestTokens[0]!);
    expect(notes.data?.items?.some((n) => n.type === "nudge")).toBe(true);
  });

  test("26 · 게스트는 nudge API 불가", async ({ request }) => {
    const fx = await setupLocationInvitation(request, {
      guestEmails: [LOC_GUEST_EMAILS[0]!, LOC_GUEST_EMAILS[1]!],
    });
    const parts = await getParticipants(request, fx.hostToken, fx.invitationId);
    const guestPart = parts.data?.participants.find((p) => p.participant.memberRole !== "HOST");
    const res = await nudgeParticipant(
      request,
      fx.guestTokens[0]!,
      fx.invitationId,
      guestPart!.participant.id,
    );
    expect(res.status).toBe(403);
  });
});

test.describe("위치 공유 · UI (24, 27–30)", () => {
  test("24 · geolocation 행사 좌표 고정 시 도착 배너", async ({ page, context }) => {
    const fx = await setupLocationInvitation(page.request, { eventStartAt: minutesFromNow(10) });
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({
      latitude: DEFAULT_VENUE.lat,
      longitude: DEFAULT_VENUE.lng,
    });
    await gotoLocationMap(page, fx.invitationId);
    await expect(
      page.getByText("모임 장소 근처에 도착했어요. 위치 공유를 종료합니다."),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("27 · 호스트 핀 탭 → 넛지 팝업 → 알림", async ({ page, request }) => {
    const fx = await setupLocationInvitation(request, { eventStartAt: minutesFromNow(10) });
    const away = offsetLatLng(DEFAULT_VENUE, 500, 90);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, away);
    await gotoLocationMap(page, fx.invitationId);
    await page.locator('[data-testid="participant-pin"]').first().click({ timeout: 15_000 });
    await expect(page.getByText("출발 알림 보내기")).toBeVisible();
    await page.getByRole("button", { name: "출발 알림 보내기" }).click();
    await new Promise((r) => setTimeout(r, 1_000));
    const notes = await getNotifications(request, fx.guestTokens[0]!);
    expect(notes.data?.items?.some((n) => n.type === "nudge")).toBe(true);
  });

  test("28 · 넛지 팝업에 거리 표시", async ({ page, request }) => {
    const fx = await setupLocationInvitation(request, { eventStartAt: minutesFromNow(10) });
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, offsetLatLng(DEFAULT_VENUE, 500, 0));
    await gotoLocationMap(page, fx.invitationId);
    await page.locator('[data-testid="participant-pin"]').first().click({ timeout: 15_000 });
    await expect(page.getByText(/모임 장소까지 약 \d+m/)).toBeVisible({ timeout: 15_000 });
  });

  test("29 · 지도 페이지 placeName 노출", async ({ page, pageErrors, request }) => {
    const fx = await setupLocationInvitation(request, { eventStartAt: minutesFromNow(10) });
    await gotoLocationMap(page, fx.invitationId);
    await expect(page.getByRole("heading", { name: DEFAULT_VENUE.placeName })).toBeVisible({
      timeout: 15_000,
    });
    expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("30 · A 위치 업데이트 후 호스트 지도에서 핀 표시", async ({ browser, request }) => {
    const fx = await setupLocationInvitation(request, { eventStartAt: minutesFromNow(10) });
    const away = offsetLatLng(DEFAULT_VENUE, 400, 270);
    await updateMyLocation(request, fx.guestTokens[0]!, fx.invitationId, away);

    const hostCtx = await browser.newContext({ storageState: authFile("newHost") });
    const hostPage = await hostCtx.newPage();
    await gotoLocationMap(hostPage, fx.invitationId);
    await expect(hostPage.locator('[data-testid="participant-pin"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await hostCtx.close();
  });
});
