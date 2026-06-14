import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertMinTapTarget,
  assertNoHorizontalOverflow,
  findInvitationWithParticipants,
  waitForPageSettled,
} from "./helpers";

/**
 * 실제 /invitations/:id/participants (ParticipantsContainer) 모바일 UX.
 * 게스트 시점: 전체/참석/미정/불참 탭, 참가자 클릭 → ParticipantProfilePanel 모달.
 */

const avatarRoot = "span[class*='rounded-full']";

async function gotoParticipants(page: import("@playwright/test").Page) {
  const inv = await findInvitationWithParticipants(page, 2);
  test.skip(!inv, "참가자 2명 이상인 초대장이 없어 스킵");
  await page.goto(`/invitations/${inv!.id}/participants`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageSettled(page);
  return inv!;
}

// ParticipantsContainer는 <main>을 쓰지 않으므로 page 전역에서
// "클릭 가능 + 아바타 포함" 요소(= 참가자 행)를 찾는다.
function participantRows(page: import("@playwright/test").Page) {
  return page
    .locator("[class*='cursor-pointer']")
    .filter({ has: page.locator(avatarRoot) });
}

test.describe("participants-mobile · guest", () => {
  test("참가자 화면이 가로 overflow 없이 렌더된다", async ({ page, pageErrors }) => {
    await gotoParticipants(page);
    await expect(page.getByText("참석자", { exact: false }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("탭(전체/참석/미정/불참) 전환이 동작한다", async ({ page, pageErrors }) => {
    await gotoParticipants(page);

    for (const label of ["참석", "미정", "불참", "전체"]) {
      const chip = page.getByText(label, { exact: true }).first();
      await expect(chip).toBeVisible();
      await chip.click();
      await waitForPageSettled(page);
      await assertNoHorizontalOverflow(page);
      await expectNotCrashed(page);
    }
    expectNoPageErrors(pageErrors);
  });

  test("참가자 탭 시 프로필 모달이 열리고 이름·닫기 버튼이 보인다", async ({
    page,
    pageErrors,
  }) => {
    await gotoParticipants(page);

    const rows = participantRows(page);
    const count = await rows.count();
    test.skip(count === 0, "참가자가 없어 스킵");

    await rows.first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // 모달 제목(이름)이 비어있지 않음
    await expect(dialog.getByRole("heading").first()).not.toHaveText("");
    await assertMinTapTarget(page.getByRole("button", { name: "닫기" }), 44);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 모달의 '프로필 보기'·'1:1 DM' 버튼이 활성 상태로 보인다", async ({
    page,
    pageErrors,
  }) => {
    await gotoParticipants(page);

    const rows = participantRows(page);
    const count = await rows.count();
    test.skip(count === 0, "참가자가 없어 스킵");

    await rows.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const dmBtn = dialog.getByRole("button", { name: "1:1 DM" });
    await expect(dmBtn).toBeVisible();
    await expect(dmBtn).toBeEnabled();
    await assertMinTapTarget(dmBtn, 44);
    await expect(dialog.getByRole("button", { name: "프로필 보기" })).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("닫기 버튼으로 프로필 모달을 닫을 수 있다", async ({ page, pageErrors }) => {
    await gotoParticipants(page);

    const rows = participantRows(page);
    const count = await rows.count();
    test.skip(count === 0, "참가자가 없어 스킵");

    await rows.first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
