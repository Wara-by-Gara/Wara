import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertNoHorizontalOverflow,
  findInvitationWithParticipants,
  hideDevOverlays,
  waitForPageSettled,
} from "./helpers";
import { authFile } from "./personas";

/**
 * 크로스 페르소나 — 권한 경계 및 페르소나별 렌더 스모크.
 * 1) 추가 페르소나(guestBlocked/guestRsvpAbsent)가 핵심 화면을 크래시 없이 연다.
 * 2) 게스트에게 호스트 전용 UI가 새어나오지 않는다.
 */

const CORE_PAGES = ["/", "/profile", "/notifications", "/meetings"] as const;

function personaSmoke(personaKey: "guestBlocked" | "guestRsvpAbsent") {
  test.describe(`cross-persona · ${personaKey} 스모크`, () => {
    test.use({ storageState: authFile(personaKey) });
    test.beforeEach(async ({ page }) => {
      await hideDevOverlays(page);
    });

    for (const path of CORE_PAGES) {
      test(`${path} 가 크래시·overflow·예외 없이 렌더된다`, async ({
        page,
        pageErrors,
      }) => {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await waitForPageSettled(page);
        await expectNotCrashed(page);
        await assertNoHorizontalOverflow(page);
        expectNoPageErrors(pageErrors);
      });
    }
  });
}

personaSmoke("guestBlocked");
personaSmoke("guestRsvpAbsent");

test.describe("cross-persona · 호스트 전용 UI 누출 방지 (guest)", () => {
  test.beforeEach(async ({ page }) => {
    await hideDevOverlays(page);
  });

  test("게스트의 참가자 화면에는 호스트 전용 '더보기' 액션이 없다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 있는 초대장이 없어 스킵");

    // 게스트로 참여 중인 초대장만 검증 (호스트면 더보기가 정상 노출)
    test.skip(inv!.myRole === "HOST", "호스트 초대장이라 스킵");

    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    // 참가자 행의 호스트 전용 onMore 액션(더보기)은 게스트에게 렌더되지 않아야 함
    await expect(page.getByRole("button", { name: "더보기" })).toHaveCount(0);
    // 메모/차단 탭도 호스트 전용
    await expect(page.getByText("차단", { exact: true })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("게스트는 호스트 전용 메모 탭을 볼 수 없다", async ({ page, pageErrors }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 있는 초대장이 없어 스킵");
    test.skip(inv!.myRole === "HOST", "호스트 초대장이라 스킵");

    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    await expect(page.getByText("메모", { exact: true })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
