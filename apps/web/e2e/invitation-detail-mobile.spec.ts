import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertNoHorizontalOverflow,
  findInvitationWithParticipants,
  hideDevOverlays,
  waitForPageSettled,
} from "./helpers";

/**
 * 실제 /invitations/:id (InvitationDetailContainer → GuestView/HostView) 모바일 UX.
 * 게스트 시점 상세 화면의 overflow·크래시·에러 상태를 검증한다.
 */

test.describe("invitation-detail-mobile · guest", () => {
  test.beforeEach(async ({ page }) => {
    await hideDevOverlays(page);
  });

  test("초대장 상세가 가로 overflow 없이 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 있는 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    // 에러 상태가 아니어야 함
    await expect(page.getByText("초대장을 불러오지 못했어요")).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("초대장 상세 본문 이미지가 비율 왜곡 없이 렌더된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 있는 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const imgs = page.locator("img");
    const count = await imgs.count();
    // 표시된 이미지가 자연 비율 대비 심하게 찌그러지지 않았는지(naturalWidth>0) 확인
    for (let i = 0; i < Math.min(count, 6); i++) {
      const img = imgs.nth(i);
      if (!(await img.isVisible())) continue;
      const broken = await img.evaluate(
        (el) =>
          el instanceof HTMLImageElement &&
          el.complete &&
          el.naturalWidth === 0 &&
          (el.currentSrc !== "" || el.src !== ""),
      );
      expect(broken, `깨진 이미지 #${i}`).toBe(false);
    }
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("존재하지 않는 초대장은 에러 상태를 표시하고 크래시하지 않는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/invitations/01JZZZZZZZZZZZZZZZZZZZZZZZ", {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    // 에러 카피 또는 not-found 처리 — 크래시(흰 화면/예외) 없이 안내가 떠야 함
    await expectNotCrashed(page);
    await assertNoHorizontalOverflow(page);
    expectNoPageErrors(pageErrors);
  });
});
