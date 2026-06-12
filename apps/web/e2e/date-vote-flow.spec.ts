import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { authFile } from "./personas";
import {
  closeVotePoll,
  confirmVoteSlot,
  createDateVotePoll,
  createInvitation,
  devToken,
  getInvitationDetail,
  getVotePoll,
  getVoteResults,
  joinInvitation,
  processExpiredVotePolls,
  setupOpenVoteInvitation,
  submitVoteResponses,
  uniqueTitle,
  VOTE_GUEST2_EMAIL,
  VOTE_GUEST_EMAIL,
  VOTE_HOST_EMAIL,
} from "./vote-flow-api";
import {
  mockGifTrending,
  openVoteFromPreviewCard,
  safeGoto,
  waitForPublicLinkRedirect,
  waitForVotePageData,
} from "./helpers";

/**
 * 날짜 투표 전체 플로우 E2E (21케이스)
 * — API 검증 + 핵심 UI 검증
 */

test.describe("날짜 투표 플로우 · API (01–12, 14–20)", () => {
  test("01 · 미정 일정 초대장 생성 후 투표 poll이 open 상태로 생성된다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);
    expect(fx.poll.status).toBe("open");
    const detail = await getInvitationDetail(request, fx.hostToken, fx.invitationId);
    expect(detail.data?.eventStartAt).toBeNull();
    expect(detail.data?.dateVotePollStatus).toBe("open");
  });

  test("02 · [엣지] API는 동일 날짜·시간 슬롯 중복 생성을 거부한다", async ({
    request,
  }) => {
    const hostToken = await devToken(request, VOTE_HOST_EMAIL);
    const inv = await createInvitation(request, hostToken, uniqueTitle("E2E Dup"));
    expect(inv.status).toBe(201);
    const dup = await createDateVotePoll(request, hostToken, inv.data!.id, [
      { date: "2026-09-01", startTime: "18:00", sortOrder: 0 },
      { date: "2026-09-01", startTime: "18:00", sortOrder: 1 },
    ]);
    expect(dup.status).toBe(400);
    expect(dup.errorCode).toBe("VALIDATION_ERROR");
  });

  test("04 · GET /invitations/:id 응답에 dateVotePollStatus가 포함된다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);
    const detail = await getInvitationDetail(request, fx.hostToken, fx.invitationId);
    expect(detail.data?.dateVotePollStatus).toBe("open");
  });

  test("06 · 게스트 👍 투표 후 집계 good 카운트가 증가한다", async ({ request }) => {
    const fx = await setupOpenVoteInvitation(request);
    const guestToken = fx.guestTokens[0]!;
    const slotId = fx.slots[0]!.id;
    const submit = await submitVoteResponses(request, guestToken, fx.invitationId, [
      { slotId, response: "good" },
    ]);
    expect(submit.status).toBe(200);
    const results = await getVoteResults(request, fx.hostToken, fx.invitationId);
    const row = results.data!.slotResults.find((r) => r.slot.id === slotId);
    expect(row?.counts.good).toBe(1);
    expect(results.data!.voterCount).toBe(1);
  });

  test("08 · 마감일(closesAt)이 설정된 poll은 미래 시각을 갖는다", async ({ request }) => {
    const closesAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const fx = await setupOpenVoteInvitation(request, { closesAt });
    expect(new Date(fx.poll.closesAt).getFullYear()).toBeLessThan(2099);
  });

  test("09 · 마감 시간 경과 후 스케줄러가 투표를 자동 종료한다", async ({
    request,
  }) => {
    const closesAt = new Date(Date.now() + 2_000).toISOString();
    const fx = await setupOpenVoteInvitation(request, { closesAt });
    await new Promise((r) => setTimeout(r, 2_500));
    const triggered = await processExpiredVotePolls(request);
    expect(triggered.status).toBe(200);
    const poll = await getVotePoll(request, fx.hostToken, fx.invitationId);
    expect(poll.data?.poll.status).toBe("closed");
    const submit = await submitVoteResponses(request, fx.guestTokens[0]!, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    expect(submit.status).toBe(422);
    expect(submit.errorCode).toBe("VOTE_POLL_CLOSED");
  });

  test("10 · 호스트가 투표를 조기 종료하면 status가 closed가 된다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);
    const closed = await closeVotePoll(request, fx.hostToken, fx.invitationId);
    expect(closed.status).toBe(200);
    expect(closed.data?.status).toBe("closed");
    const poll = await getVotePoll(request, fx.hostToken, fx.invitationId);
    expect(poll.data?.poll.status).toBe("closed");
  });

  test("11 · 마감된 투표에는 추가 응답을 제출할 수 없다", async ({ request }) => {
    const fx = await setupOpenVoteInvitation(request);
    await closeVotePoll(request, fx.hostToken, fx.invitationId);
    const guestToken = fx.guestTokens[0]!;
    const submit = await submitVoteResponses(request, guestToken, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    expect(submit.status).toBe(422);
    expect(submit.errorCode).toBe("VOTE_POLL_CLOSED");
  });

  test("12 · 동점 1위가 있으면 마감 후 자동 확정되지 않는다", async ({ request }) => {
    const fx = await setupOpenVoteInvitation(request, {
      joinGuests: [VOTE_GUEST_EMAIL, VOTE_GUEST2_EMAIL],
    });
    const [g1, g2] = fx.guestTokens;
    await submitVoteResponses(request, g1!, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    await submitVoteResponses(request, g2!, fx.invitationId, [
      { slotId: fx.slots[1]!.id, response: "good" },
    ]);
    const closed = await closeVotePoll(request, fx.hostToken, fx.invitationId);
    expect(closed.data?.status).toBe("closed");
    expect(closed.data?.confirmedSlotId).toBeNull();
  });

  test("14 · 동점 마감 후 호스트가 슬롯을 확정하면 eventStartAt과 poll confirmed가 설정된다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request, {
      joinGuests: [VOTE_GUEST_EMAIL, VOTE_GUEST2_EMAIL],
    });
    await submitVoteResponses(request, fx.guestTokens[0]!, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    await submitVoteResponses(request, fx.guestTokens[1]!, fx.invitationId, [
      { slotId: fx.slots[1]!.id, response: "good" },
    ]);
    const closed = await closeVotePoll(request, fx.hostToken, fx.invitationId);
    expect(closed.data?.status).toBe("closed");
    const confirmed = await confirmVoteSlot(
      request,
      fx.hostToken,
      fx.invitationId,
      fx.slots[0]!.id,
    );
    expect(confirmed.status).toBe(200);
    expect(confirmed.data?.status).toBe("confirmed");
    const detail = await getInvitationDetail(request, fx.hostToken, fx.invitationId);
    expect(detail.data?.eventStartAt).not.toBeNull();
    expect(detail.data?.dateVotePollStatus).toBe("confirmed");
  });

  test("15 · 단독 1위일 때 마감 시 자동으로 날짜가 확정된다", async ({ request }) => {
    const fx = await setupOpenVoteInvitation(request);
    const guestToken = fx.guestTokens[0]!;
    await submitVoteResponses(request, guestToken, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    const closed = await closeVotePoll(request, fx.hostToken, fx.invitationId);
    expect(closed.data?.status).toBe("confirmed");
    expect(closed.data?.confirmedSlotId).toBe(fx.slots[0]!.id);
    const detail = await getInvitationDetail(request, fx.hostToken, fx.invitationId);
    expect(detail.data?.eventStartAt).not.toBeNull();
  });

  test("16 · 익명 투표는 results에 voters 목록을 노출하지 않는다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request, { isAnonymous: true });
    const guestToken = fx.guestTokens[0]!;
    await submitVoteResponses(request, guestToken, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    const results = await getVoteResults(request, fx.hostToken, fx.invitationId);
    const row = results.data!.slotResults[0]!;
    expect(row.counts.good).toBe(1);
    expect(row).not.toHaveProperty("voters");
  });

  test("17 · 같은 날 여러 시간대 슬롯에 동시에 good 응답할 수 있다", async ({
    request,
  }) => {
    const hostToken = await devToken(request, VOTE_HOST_EMAIL);
    const inv = await createInvitation(request, hostToken, uniqueTitle("E2E Multi"));
    const poll = await createDateVotePoll(request, hostToken, inv.data!.id, [
      { date: "2026-10-01", startTime: "12:00", sortOrder: 0 },
      { date: "2026-10-01", startTime: "18:00", sortOrder: 1 },
    ]);
    const guestToken = await devToken(request, VOTE_GUEST_EMAIL);
    await joinInvitation(request, guestToken, inv.data!.id);
    const [s0, s1] = poll.data!.slots;
    const submit = await submitVoteResponses(request, guestToken, inv.data!.id, [
      { slotId: s0!.id, response: "good" },
      { slotId: s1!.id, response: "good" },
    ]);
    expect(submit.status).toBe(200);
  });

  test("18 · 비참가자는 GET /vote 에서 PARTICIPANT_NOT_FOUND를 받는다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request, { joinGuests: [] });
    const outsider = await devToken(request, VOTE_GUEST_EMAIL);
    const poll = await getVotePoll(request, outsider, fx.invitationId);
    expect(poll.status).toBe(404);
    expect(poll.errorCode).toBe("PARTICIPANT_NOT_FOUND");
  });

  test("19 · eventStartAt이 있는 초대장에는 투표를 생성할 수 없다", async ({
    request,
  }) => {
    const hostToken = await devToken(request, VOTE_HOST_EMAIL);
    const inv = await createInvitation(request, hostToken, uniqueTitle("E2E Fixed"), {
      eventStartAt: "2026-12-25T18:00:00+09:00",
    });
    expect(inv.status).toBe(201);
    const poll = await createDateVotePoll(request, hostToken, inv.data!.id, [
      { date: "2026-12-26", startTime: "18:00" },
    ]);
    expect(poll.status).toBe(422);
    expect(poll.errorCode).toBe("VOTE_EVENT_DATE_SET");
  });

  test("20 · 게스트 투표 후 호스트 results의 voterCount가 반영된다", async ({
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request, {
      joinGuests: [VOTE_GUEST_EMAIL, VOTE_GUEST2_EMAIL],
    });
    await submitVoteResponses(request, fx.guestTokens[0]!, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    await submitVoteResponses(request, fx.guestTokens[1]!, fx.invitationId, [
      { slotId: fx.slots[1]!.id, response: "maybe" },
    ]);
    const results = await getVoteResults(request, fx.hostToken, fx.invitationId);
    expect(results.data!.voterCount).toBe(2);
  });
});

test.describe("날짜 투표 플로우 · 호스트 UI (03, 07, 09, 13)", () => {
  test.use({ storageState: authFile("newHost") });

  test("03 · 초대장 생성 시 일정 미정이면 날짜 투표 만들기 UI가 노출된다", async ({
    page,
    pageErrors,
  }) => {
    await mockGifTrending(page);
    await page.goto("/invitations/create", { waitUntil: "domcontentloaded" });
    await page.getByText("모임 날짜").scrollIntoViewIfNeeded();
    await page
      .locator("label")
      .filter({ hasText: "아직 정해지지 않았어요" })
      .first()
      .getByRole("switch")
      .click();
    await expect(page.getByText("날짜 투표로 정해볼까요?")).toBeVisible();
    await expect(page.getByRole("button", { name: "날짜 투표 만들기" })).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("07 · 호스트 상세에서 진행 중 투표 미리보기 카드를 볼 수 있다", async ({
    page,
    pageErrors,
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);
    await page.goto(`/invitations/${fx.invitationId}`, { waitUntil: "domcontentloaded" });
    await openVoteFromPreviewCard(page, fx.invitationId);
    await expect(page.getByText(/투표 진행 중 · 마감일 없음/)).toBeVisible({
      timeout: 15_000,
    });
    expectNoPageErrors(pageErrors);
  });

  test("09 · 마감일 없는 투표는 '마감일 없음' 배너를 표시한다", async ({
    page,
    pageErrors,
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);
    const guestToken = await devToken(request, VOTE_HOST_EMAIL);
    const voteReady = waitForVotePageData(page, fx.invitationId);
    await page.goto(`/invitations/${fx.invitationId}/vote`, {
      waitUntil: "domcontentloaded",
    });
    await voteReady;
    await expect(page.getByText(/투표 진행 중 · 마감일 없음/)).toBeVisible();
    expectNoPageErrors(pageErrors);
    void guestToken;
  });

  test("13 · 동점 마감 후 호스트가 확정하기 버튼으로 날짜를 선정할 수 있다", async ({
    page,
    pageErrors,
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request, {
      joinGuests: [VOTE_GUEST_EMAIL, VOTE_GUEST2_EMAIL],
    });
    await submitVoteResponses(request, fx.guestTokens[0]!, fx.invitationId, [
      { slotId: fx.slots[0]!.id, response: "good" },
    ]);
    await submitVoteResponses(request, fx.guestTokens[1]!, fx.invitationId, [
      { slotId: fx.slots[1]!.id, response: "good" },
    ]);
    await closeVotePoll(request, fx.hostToken, fx.invitationId);

    const voteReady = waitForVotePageData(page, fx.invitationId);
    await page.goto(`/invitations/${fx.invitationId}/vote`, {
      waitUntil: "domcontentloaded",
    });
    await voteReady;
    await expect(page.getByText("투표가 마감되었어요")).toBeVisible();
    const confirmBtn = page.getByRole("button", { name: "이 날짜로 확정" }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();
    await page.getByRole("button", { name: "확정하기" }).click();
    await expect(page.getByText("날짜가 확정됐어요!")).toBeVisible({
      timeout: 15_000,
    });
    expectNoPageErrors(pageErrors);
  });
});

test.describe("날짜 투표 플로우 · 게스트 UI (05, 06-UI)", () => {
  test.use({ storageState: authFile("guest") });

  test("05 · 공개 링크(/i/:id)로 진입하면 진행 중 투표 화면으로 이동한다", async ({
    page,
    pageErrors,
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);

    await safeGoto(page, `/i/${fx.invitationId}`);
    await waitForPublicLinkRedirect(page, fx.invitationId, { hasOpenPoll: true });
    await expect(page.getByText("일정 투표", { exact: true })).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("06-UI · 게스트가 👍 투표하면 화면에 참여 집계가 표시된다", async ({
    page,
    pageErrors,
    request,
  }) => {
    const fx = await setupOpenVoteInvitation(request);

    const voteReady = waitForVotePageData(page, fx.invitationId);
    await page.goto(`/invitations/${fx.invitationId}/vote`, {
      waitUntil: "domcontentloaded",
    });
    await voteReady;

    const voteBtn = page
      .locator(".overflow-hidden.rounded-md")
      .getByRole("button")
      .filter({ hasText: "👍" })
      .first();
    await expect(voteBtn).toBeVisible({ timeout: 15_000 });
    await voteBtn.click();
    await expect(page.getByText(/저장 중|응답이 자동 저장됩니다/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/응답 1명/)).toBeVisible({ timeout: 15_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
