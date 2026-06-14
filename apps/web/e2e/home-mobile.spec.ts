import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertNoHorizontalOverflow,
  hideDevOverlays,
  waitForPageSettled,
} from "./helpers";

/**
 * 실제 홈(/, HomeContainer) 모바일 UX — 로그인 상태(hostNew).
 * HomeHeader + 다가오는 모임/인기 초대장/추천 이벤트 섹션.
 */

test.describe("home-mobile · hostNew", () => {
  test.beforeEach(async ({ page }) => {
    await hideDevOverlays(page);
  });

  test("홈이 가로 overflow 없이 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await expect(page.getByText("다가오는 모임").first()).toBeVisible({
      timeout: 15_000,
    });
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("헤더 액션 버튼(초대장 만들기·알림)이 표시되고 탭 가능하다", async ({
    page,
    pageErrors,
  }) => {
    // 참고: 현재 헤더 pill(h-9) 안의 액션 버튼은 size-8(32px)로 44px 미만(H-001, 헤더 재설계 시 처리).
    // 여기서는 버튼이 정상 노출·클릭 가능한지만 검증한다.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await expect(page.getByRole("button", { name: "초대장 만들기" })).toBeVisible();
    await expect(page.getByRole("button", { name: /알림/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "초대장 만들기" })).toBeEnabled();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("주요 섹션(다가오는 모임·인기 초대장·추천 이벤트)이 모두 렌더된다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    for (const heading of ["다가오는 모임", "인기 초대장", "추천 이벤트"]) {
      await expect(page.getByText(heading).first()).toBeVisible({
        timeout: 15_000,
      });
    }
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("스크롤해도 가로 overflow가 발생하지 않는다", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    // mobile WebKit은 mouse.wheel 미지원 — 스크롤 컨테이너(main)를 직접 스크롤
    await page
      .locator("main")
      .first()
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
