import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  findGuestInvitationWithOpenPoll,
  findGuestInvitationWithoutOpenPoll,
  safeGoto,
  waitForPublicLinkRedirect,
  waitForVotePageData,
} from "./helpers";

// 게스트 페르소나: 진행 중 날짜 투표 화면.
test.describe("guest-vote", () => {
  test("진행 중 투표 화면이 크래시 없이 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitationWithOpenPoll(page);
    test.skip(!inv, "진행 중 투표가 있는 게스트 초대장이 없어 스킵");

    const voteReady = waitForVotePageData(page, inv!.id);
    await page.goto(`/invitations/${inv!.id}/vote`, { waitUntil: "domcontentloaded" });
    await voteReady;
    await expect(page.getByText("일정 투표", { exact: true })).toBeVisible();
    await expect(page.getByText(/투표 진행 중|투표 마감/)).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("공개 링크에서 투표 화면으로 진입한 뒤 응답을 제출할 수 있다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitationWithOpenPoll(page);
    test.skip(!inv, "진행 중 투표가 있는 게스트 초대장이 없어 스킵");

    await safeGoto(page, `/i/${inv!.id}`);
    await waitForPublicLinkRedirect(page, inv!.id, { hasOpenPoll: true });
    await expect(page.getByText("일정 투표", { exact: true })).toBeVisible();

    const voteBtn = page
      .locator(".overflow-hidden.rounded-2xl")
      .getByRole("button")
      .filter({ hasText: "👍" })
      .first();
    await expect(voteBtn).toBeVisible({ timeout: 10_000 });
    await voteBtn.click();
    await expect(page.getByText(/저장 중|응답이 자동 저장됩니다/)).toBeVisible({
      timeout: 10_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("진행 중 투표가 없는 초대장의 /vote 화면이 크래시 없이 렌더된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitationWithoutOpenPoll(page);
    test.skip(!inv, "open poll이 없는 게스트 초대장이 없어 스킵");

    const voteReady = waitForVotePageData(page, inv!.id);
    await page.goto(`/invitations/${inv!.id}/vote`, { waitUntil: "domcontentloaded" });
    await voteReady;
    await expect(page.getByText("일정 투표", { exact: true })).toBeVisible();
    await expect(
      page.getByText(/투표가 마감되었어요|투표 진행 중|날짜가 확정됐어요/),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
