import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertBoxSize,
  assertInViewport,
  assertMinTapTarget,
  assertNoHorizontalOverflow,
  findGuestInvitation,
  TEST_IMAGE_PATH,
  waitForPageSettled,
} from "./helpers";
import { authFile } from "./personas";

// 모바일( iPhone 14 Pro ) 기준 — 프로필 사진·아바타·터치 UX
test.describe("mobile-profile · guest", () => {
  test("마이페이지가 가로 overflow 없이 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);
    await expect(page.getByText("마이페이지")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("마이페이지 프로필 아바타가 표시된다 (size-25 ≈ 100px)", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const profileSection = page
      .locator("section")
      .filter({ has: page.getByLabel("프로필 사진 변경") });
    const avatar = profileSection.locator("span[class*='rounded-full']").first();
    await assertBoxSize(avatar, 96, 104);
    await assertInViewport(page, avatar);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("마이페이지 카메라 버튼 터치 영역이 44px 이상이다", async ({ page, pageErrors }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await assertMinTapTarget(page.getByLabel("프로필 사진 변경"), 44);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("마이페이지 설정 버튼 터치 영역이 44px 이상이다", async ({ page, pageErrors }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await assertMinTapTarget(page.getByLabel("설정"), 44);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 수정 화면 아바타가 표시된다 (size-25 ≈ 100px, 마이페이지와 동일)", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);
    await expect(page.getByText("프로필 수정")).toBeVisible();

    const editAvatar = page
      .locator("main")
      .locator("span[class*='rounded-full']")
      .first();
    await assertBoxSize(editAvatar, 96, 104);
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 수정 사진 변경·저장 버튼 터치 영역이 충분하다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await assertMinTapTarget(page.getByRole("button", { name: "사진 변경" }), 44);
    await assertMinTapTarget(page.getByRole("button", { name: "저장" }), 44);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("크롭 UI가 모바일 viewport 안에 표시된다", async ({ page, pageErrors }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByText("이미지 자르기")).toBeVisible();
    await assertInViewport(page, page.getByRole("button", { name: "맞췄어요" }));
    await assertMinTapTarget(page.getByRole("button", { name: "맞췄어요" }), 44);
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글 페이지 참가자 아바타가 sm 크기(≈36px)이다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    const commentAvatarBtn = page.locator("div.px-4 button").first();
    const commentCount = await page.locator("div.px-4").count();
    test.skip(commentCount === 0, "댓글이 없어 아바타 스킵");

    const avatar = commentAvatarBtn.locator("span[class*='rounded-full']").first();
    await assertBoxSize(avatar, 34, 38);
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글 아바타 탭 시 프로필 모달이 열리고 닫을 수 있다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await waitForPageSettled(page);

    const avatarBtn = page.locator("div.px-4 button").first();
    const commentCount = await page.locator("div.px-4").count();
    test.skip(commentCount === 0, "댓글이 없어 스킵");

    await avatarBtn.click();
    await expect(page.getByRole("button", { name: "닫기" })).toBeVisible({
      timeout: 10_000,
    });

    const modalAvatar = page
      .locator("[role='dialog'], [class*='Modal']")
      .locator("span[class*='rounded-full']")
      .first();
    await assertBoxSize(modalAvatar, 72, 80);
    await assertMinTapTarget(page.getByRole("button", { name: "닫기" }), 44);

    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByRole("button", { name: "닫기" })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("mobile-profile · guestNoPhoto", () => {
  test.use({ storageState: authFile("guestNoPhoto") });

  test("프로필 사진 없을 때 마이페이지 아바타 fallback이 표시된다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const meRes = await page.request.get("/api/users/me");
    expect(meRes.ok()).toBeTruthy();
    const meBody = (await meRes.json()) as {
      data?: { profileImageUrl?: string | null };
    };
    expect(meBody.data?.profileImageUrl ?? null).toBeNull();

    const profileSection = page
      .locator("section")
      .filter({ has: page.getByLabel("프로필 사진 변경") });
    const avatar = profileSection.locator("span[class*='rounded-full']").first();
    await expect(avatar).toBeVisible();
    await assertBoxSize(avatar, 96, 104);

    const brokenImg = profileSection.locator("img[src=''], img:not([src])");
    await expect(brokenImg).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
