import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";

// 게스트 페르소나: 알림 목록 인터랙션.
test.describe("guest-notifications", () => {
  test("알림 필터·모두 읽음·삭제 UI가 크래시 없이 동작한다", async ({
    page,
    pageErrors,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "Notification", {
        value: {
          permission: "granted",
          requestPermission: async () => "granted",
        },
        configurable: true,
      });
    });

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);

    const isEmpty = await page.getByText("새 알림이 없어요").isVisible();
    if (isEmpty) {
      expectNoPageErrors(pageErrors);
      return;
    }

    await page.getByRole("button", { name: "안 읽음" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "모두 읽음" }).click();
    await expect(page.getByText("모든 알림을 읽음 처리할까요?")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("모든 알림을 읽음 처리할까요?")).toHaveCount(0);

    const deleteBtn = page.getByRole("button", { name: "알림 삭제" }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("알림 목록 API 실패 시 ErrorState를 보여준다", async ({ page, pageErrors }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "Notification", {
        value: {
          permission: "granted",
          requestPermission: async () => "granted",
        },
        configurable: true,
      });
    });

    await page.route("**/api/notifications**", async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() !== "GET" || url.pathname !== "/api/notifications") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "E2E mock failure" } }),
      });
    });

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.getByText("알림을 불러오지 못했어요")).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
