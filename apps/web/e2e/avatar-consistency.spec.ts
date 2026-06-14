import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertBoxSize,
  findInvitationWithParticipants,
  waitForPageSettled,
} from "./helpers";
import { authFile } from "./personas";

/**
 * 아바타 크기 일관성 감사 — 실제 라우트 기준.
 * Avatar size variant ↔ 실제 렌더 px가 화면마다 일관적인지 검증한다.
 *
 * | 컨텍스트            | size  | px  | 허용 범위 |
 * |---------------------|-------|-----|-----------|
 * | 마이페이지 프로필   | 2xl   | 100 | 96~104    |
 * | 프로필 수정         | 2xl   | 100 | 96~104    |
 * | 댓글 아이템         | sm    | 36  | 34~38     |
 * | 참가자 아이템       | md    | 52  | 50~54     |
 * | 참가자 프로필 모달  | xl    | 76  | 72~80     |
 */

const avatarRoot = (scope = "") => `${scope} span[class*='rounded-full']`.trim();

test.describe("avatar-consistency · guest", () => {
  test("마이페이지 프로필 아바타가 2xl(≈100px)이다", async ({ page, pageErrors }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const section = page
      .locator("section")
      .filter({ has: page.getByLabel("프로필 사진 변경") });
    await assertBoxSize(section.locator(avatarRoot()).first(), 96, 104);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 수정 아바타가 2xl(≈100px)로 마이페이지와 동일하다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const editAvatar = page.locator("main").locator(avatarRoot()).first();
    await assertBoxSize(editAvatar, 96, 104);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("참가자 목록 아바타가 md(≈52px)이다", async ({ page, pageErrors }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 2명 이상인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    // ParticipantsContainer는 <main>을 쓰지 않음 — 참가자 행(클릭 가능 + 아바타)에서 조회
    const rows = page
      .locator("[class*='cursor-pointer']")
      .filter({ has: page.locator(avatarRoot()) });
    const count = await rows.count();
    test.skip(count === 0, "참가자가 없어 스킵");

    await assertBoxSize(rows.first().locator(avatarRoot()).first(), 50, 54);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("참가자 프로필 모달 아바타가 xl(≈76px)이다", async ({ page, pageErrors }) => {
    const inv = await findInvitationWithParticipants(page, 2);
    test.skip(!inv, "참가자 2명 이상인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    const rows = page
      .locator("[class*='cursor-pointer']")
      .filter({ has: page.locator(avatarRoot()) });
    const rowCount = await rows.count();
    test.skip(rowCount === 0, "클릭 가능한 참가자 행이 없어 스킵");

    await rows.first().click();
    const closeBtn = page.getByRole("button", { name: "닫기" });
    await expect(closeBtn).toBeVisible({ timeout: 10_000 });

    const modalAvatar = page
      .getByRole("dialog")
      .locator(avatarRoot())
      .first();
    await assertBoxSize(modalAvatar, 72, 80);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("avatar-consistency · guestNoPhoto fallback", () => {
  test.use({ storageState: authFile("guestNoPhoto") });

  test("프로필 사진 없을 때 마이페이지·프로필수정 아바타가 깨진 img 없이 fallback된다", async ({
    page,
    pageErrors,
  }) => {
    for (const path of ["/profile", "/profile/edit"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await waitForPageSettled(page);

      const avatar = page.locator("main, section").locator(avatarRoot()).first();
      await expect(avatar).toBeVisible();

      // src가 비었거나 없는 img가 노출되면 fallback 실패
      const brokenImg = page.locator("main img[src=''], main img:not([src])");
      await expect(brokenImg).toHaveCount(0);
      await expectNotCrashed(page);
    }
    expectNoPageErrors(pageErrors);
  });
});
