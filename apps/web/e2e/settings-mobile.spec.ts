import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  assertNoHorizontalOverflow,
  hideDevOverlays,
  waitForPageSettled,
} from "./helpers";

/**
 * 실제 /profile/settings (SettingsContainer) 모바일 UX.
 * 화면 내 네비게이션(main→notification/terms)은 URL 변경 없이 상태로 전환된다.
 */

test.describe("settings-mobile · guest", () => {
  test.beforeEach(async ({ page }) => {
    await hideDevOverlays(page);
  });

  test("설정 화면이 가로 overflow 없이 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await expect(page.getByText("설정", { exact: true }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("알림 설정 진입 후 토글이 렌더되고 상호작용해도 크래시하지 않는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await page.getByText("알림 설정", { exact: true }).click();
    await expect(
      page.getByText("알림 설정", { exact: true }).first(),
    ).toBeVisible();

    // 스위치는 서버 영속(컨트롤드) + pending 동안 disabled — 즉시 상태반전을 단언하지 않고
    // 렌더·상호작용·비크래시만 검증한다. (낙관적 업데이트 부재는 UX 관찰 항목으로 별도 기록)
    const firstSwitch = page.getByRole("switch").first();
    await expect(firstSwitch).toBeVisible({ timeout: 10_000 });
    await expect(firstSwitch).toBeEnabled({ timeout: 10_000 });
    await firstSwitch.click();
    await waitForPageSettled(page);

    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("이용약관 진입 후 내용이 표시된다", async ({ page, pageErrors }) => {
    await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await page.getByText("이용약관", { exact: true }).click();
    // 약관 상세 화면 헤더
    await expect(
      page.getByText("이용약관", { exact: true }).first(),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("알림 설정에서 뒤로가면 설정 메인으로 돌아온다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });
    await waitForPageSettled(page);

    await page.getByText("알림 설정", { exact: true }).click();
    await expect(page.getByRole("switch").first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "뒤로가기" }).click();
    // 메인으로 복귀 — '권한' 섹션 타이틀이 다시 보임
    await expect(page.getByText("권한", { exact: true })).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
