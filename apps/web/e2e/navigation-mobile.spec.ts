import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertMinTapTarget,
  assertNoHorizontalOverflow,
  hideDevOverlays,
  waitForPageSettled,
} from "./helpers";

/**
 * 전역 하단 내비게이션(MainBottomNav) 모바일 UX.
 * 로그인 상태(hostNew) 기준 — 홈/일정/만들기/친구/프로필 5탭.
 * 라우트는 app/layout.tsx에서 전역 렌더되며 /chats, /location 등에서만 숨겨진다.
 */

const NAV_LABELS = ["홈", "일정", "친구", "프로필"] as const;

test.describe("navigation-mobile · hostNew", () => {
  test.beforeEach(async ({ page }) => {
    await hideDevOverlays(page);
  });

  test("하단 내비 4개 일반 탭이 44px 이상 터치 영역을 갖는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    for (const label of NAV_LABELS) {
      const link = page.getByRole("link", { name: label });
      await expect(link).toBeVisible();
      await assertMinTapTarget(link, 44);
    }
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("'만들기' FAB 버튼이 44px 이상이다", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const fab = page.getByRole("link", { name: "만들기" });
    await expect(fab).toBeVisible();
    await assertMinTapTarget(fab, 44);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("홈→일정→친구→프로필 탭 전환이 각 화면으로 이동한다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const routes: { label: string; urlPart: RegExp }[] = [
      { label: "일정", urlPart: /\/meetings/ },
      { label: "친구", urlPart: /\/friends/ },
      { label: "프로필", urlPart: /\/profile/ },
      { label: "홈", urlPart: /\/$/ },
    ];

    for (const { label, urlPart } of routes) {
      await page.getByRole("link", { name: label }).click();
      await page.waitForURL(urlPart, { timeout: 15_000 });
      await waitForPageSettled(page);
      await expectNotCrashed(page);
      await assertNoHorizontalOverflow(page);
    }
    expectNoPageErrors(pageErrors);
  });

  test("하단 내비가 화면 하단에 고정되어 뷰포트 안에 보인다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    const nav = page.getByRole("link", { name: "홈" });
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    // 내비가 뷰포트 하단부에 위치 (상단 절반보다 아래)
    expect(box!.y).toBeGreaterThan(viewport!.height / 2);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 2);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("DM 채팅방에서는 하단 내비가 숨겨진다", async ({ page, pageErrors }) => {
    // /chats/* 에서는 MainBottomNav가 null을 반환 (HIDDEN 규칙)
    await page.goto("/chats/nonexistent", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await expect(page.getByRole("link", { name: "홈" })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
