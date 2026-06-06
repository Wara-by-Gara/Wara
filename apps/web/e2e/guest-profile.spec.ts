import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { safeGoto, TEST_IMAGE_PATH } from "./helpers";

// 게스트 페르소나: 프로필 편집·약관·계정 탈퇴 UI(실제 탈퇴 실행 금지).
test.describe("guest-profile", () => {
  test("프로필 수정 페이지가 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await expect(page.getByText("프로필 수정")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("닉네임이 비면 저장 버튼이 비활성화된다", async ({ page, pageErrors }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const nicknameInput = page.locator('input[maxlength="20"]').first();
    await nicknameInput.fill("");
    await expect(page.getByRole("button", { name: "저장" })).toBeDisabled();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 사진 선택 시 크롭 UI가 나타난다", async ({ page, pageErrors }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByText("이미지 자르기")).toBeVisible();
    await expect(page.getByRole("button", { name: "맞췄어요" })).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("프로필 사진 크롭 후 업로드 시도가 크래시하지 않는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByText("이미지 자르기")).toBeVisible();
    await page.getByRole("button", { name: "맞췄어요" }).click();

    // S3/presigned 환경에 따라 저장 성공·실패 UI가 달라질 수 있음.
    await expect(
      page.getByText("프로필 수정").or(page.getByText("저장에 실패했어요")),
    ).toBeVisible({ timeout: 20_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("완료된 프로필은 /signup 접근 시 홈으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => !url.pathname.includes("/signup"), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/signup/);
  });

  test("필수 약관이 없으면 /terms/agree?returnTo= 는 returnTo로 이동한다", async ({
    page,
  }) => {
    await safeGoto(page, "/terms/agree?returnTo=/profile");
    await page.waitForURL(/\/profile/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/profile/);
  });

  test("회원 탈퇴 다단계 UI를 탐색하고 최종 확인에서 취소한다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/account", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expect(page.getByText("계정 관리")).toBeVisible();

    await page.getByText("회원 탈퇴").click();
    await expect(page.getByText("탈퇴 전 확인해주세요")).toBeVisible();
    await page.getByRole("button", { name: "계속 진행" }).click();

    await expect(page.getByText("떠나시는 이유를 알려주세요")).toBeVisible();
    await page.getByRole("button", { name: "계속", exact: true }).click();

    await expect(page.getByText("정말 탈퇴할까요?")).toBeVisible();
    await expect(page.getByRole("button", { name: "탈퇴" })).toBeDisabled();

    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("계정 관리")).toBeVisible();
    await expect(page.getByText("회원 탈퇴")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("프로필 사진 크롭 화면에서 뒤로가기 시 편집 화면으로 돌아간다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByText("이미지 자르기")).toBeVisible();
    await page.getByRole("button", { name: "뒤로가기" }).click();

    await expect(page.getByText("프로필 수정")).toBeVisible();
    await expect(page.getByText("이미지 자르기")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
