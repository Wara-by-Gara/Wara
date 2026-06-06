import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { findGuestInvitation, getFriends, smokeVisit } from "./helpers";

// 게스트 페르소나: 로그인 상태의 일반 사용자 흐름.
test.describe("guest", () => {
  test("로그인 홈이 인사말과 함께 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/안녕하세요/)).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("주요 페이지 스모크(캘린더/알림/프로필)", async ({ page, pageErrors }) => {
    for (const path of ["/calendar", "/notifications", "/profile"]) {
      await smokeVisit(page, pageErrors, path);
    }
  });

  test("친구 목록 → 프로필 진입", async ({ page, pageErrors }) => {
    await page.goto("/friends", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await expectNotCrashed(page);

    const friends = await getFriends(page);
    const firstFriend = friends[0];
    if (!firstFriend) {
      // 친구가 없으면 빈 상태 문구가 보여야 한다.
      await expect(page.getByText("아직 친구가 없어요")).toBeVisible();
    } else {
      // 목록의 첫 친구로 진입 → 프로필이 크래시 없이 로드.
      await page.goto(`/friends/${firstFriend.id}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await expectNotCrashed(page);
      await expect(page.getByText("함께 참여했던 초대")).toBeVisible();
    }
    expectNoPageErrors(pageErrors);
  });

  test("친구가 아닌 사용자 프로필은 친화적 에러를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    // 형식상 유효한 ULID지만 공동 참여가 없는 대상 → FRIEND_NOT_FOUND
    await page.goto("/friends/00000000000000000000000000", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await expect(page.getByText("친구 정보를 불러오지 못했어요")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("게스트 초대장 상세가 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");
    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    await expect(page.getByText("초대장을 불러오지 못했어요")).toHaveCount(0);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("존재하지 않는 초대장 ID는 친화적 에러를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/invitations/00000000000000000000000000", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await expect(page.getByText("초대장을 불러오지 못했어요")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("게스트 /admin 접근 시 크래시 없이 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
