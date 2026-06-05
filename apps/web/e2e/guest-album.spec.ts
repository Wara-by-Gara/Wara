import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { findGuestInvitation, TEST_IMAGE_PATH } from "./helpers";

// 게스트 페르소나: 초대장 사진 앨범 업로드 UI.
test.describe("guest-album", () => {
  test("사진 선택 시 미리보기가 나타나고 취소할 수 있다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByRole("button", { name: "1장 올리기" })).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByRole("button", { name: "1장 올리기" })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("사진 업로드 시도가 크래시하지 않는다(성공 또는 실패 UI)", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.getByRole("button", { name: "1장 올리기" }).click();

    // presigned/S3 환경에 따라 성공·실패 메시지가 달라질 수 있음 — 크래시만 금지.
    await expect(
      page.getByText(/업로드 완료|업로드에 실패|일부 사진 업로드에 실패|업로드 중/),
    ).toBeVisible({ timeout: 20_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("허용되지 않는 파일 형식은 무시된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByRole("button", { name: /장 올리기/ })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("다중 업로드 중 일부 실패 시 partialFailed UI가 표시된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    let presignedCalls = 0;
    await page.route("**/api/invitations/*/photos/presigned-url", async (route) => {
      presignedCalls += 1;
      if (presignedCalls === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              presignedUrl: "http://127.0.0.1:3000/e2e-mock-upload",
              key: "e2e/mock/photo-1.jpg",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "mock presigned fail" } }),
      });
    });

    await page.route("**/e2e-mock-upload", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/invitations/*/photos", async (route, request) => {
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "e2e-mock-photo-id",
            participantId: "mock",
            invitationId: inv!.id,
            imageKey: "e2e/mock/photo-1.jpg",
            likeCount: 0,
            feedbackCount: 0,
            url: "https://example.com/e2e-mock.jpg",
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_PATH]);
    await expect(page.getByRole("button", { name: "2장 올리기" })).toBeVisible();
    await page.getByRole("button", { name: "2장 올리기" }).click();

    await expect(page.getByText("일부 사진 업로드에 실패했어요")).toBeVisible({
      timeout: 20_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("presigned URL 전체 실패 시 업로드 실패 UI가 표시된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.route("**/api/invitations/*/photos/presigned-url", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "mock presigned fail" } }),
      });
    });

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.getByRole("button", { name: "1장 올리기" }).click();

    await expect(page.getByText("업로드에 실패했어요")).toBeVisible({ timeout: 20_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
