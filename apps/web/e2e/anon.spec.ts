import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { safeGoto, fetchInvitationIdAsDev } from "./helpers";

// 비로그인 사용자: 공개 페이지 / 소프트 가드 / 404·잘못된 ID 에러 처리.
test.describe("anon", () => {
  test("로그아웃 홈은 시작하기 CTA를 보여주고 크래시하지 않는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("로그인 페이지가 정상 렌더된다", async ({ page, pageErrors }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("비로그인 보호 페이지(친구/알림/캘린더) 접근 시 크래시 없이 진입 또는 로그인 가드", async ({
    page,
    pageErrors,
  }) => {
    // 친구/알림은 비로그인도 진입(소프트 가드). 캘린더는 /login 리다이렉트(하드 가드).
    for (const path of ["/friends", "/notifications"]) {
      await safeGoto(page, path);
      await page.waitForLoadState("domcontentloaded");
      await expectNotCrashed(page);
    }
    await safeGoto(page, "/meetings");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("비로그인 캘린더 접근은 로그인으로 리다이렉트된다", async ({ page }) => {
    await safeGoto(page, "/meetings");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("존재하지 않는 라우트는 404를 반환한다", async ({ page }) => {
    const res = await page.goto("/__definitely_not_a_route__", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(404);
  });

  test("잘못된 초대장 ID는 친화적 에러를 보여준다(크래시 X)", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/invitations/INVALIDIDDOESNOTEXIST", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("초대장을 불러오지 못했어요")).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("공개 초대장 랜딩(/i/:id) 잘못된 ID도 크래시하지 않는다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/i/INVALIDIDDOESNOTEXIST", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await expectNotCrashed(page);
    await expect(page.getByText("초대장을 찾을 수 없어요")).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("공개 초대장(/i/:id) 유효 ID는 anon에게 응답 폼을 보여준다", async ({
    page,
    pageErrors,
  }) => {
    const id = await fetchInvitationIdAsDev(page, "host002@wara.dev");
    test.skip(!id, "시드 초대장이 없어 스킵");
    await safeGoto(page, `/i/${id}`);
    await page.waitForTimeout(800);
    await expectNotCrashed(page);
    await expect(page.getByText("참석 여부")).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("회원가입(/signup) zod 검증: 빈 제출 시 필드 에러를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "저장하기" }).click();
    await expect(page.getByText("이름을 입력해주세요")).toBeVisible();
    await expect(page.getByText("유효한 이메일을 입력해주세요")).toBeVisible();
    await expect(page.getByText("출생연도를 입력해주세요")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("회원가입(/signup) zod 검증: 잘못된 형식 입력을 거부한다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    // 브라우저 기본 email 검증이 react-hook-form/zod보다 먼저 막으므로 novalidate로 zod만 검증.
    await page.locator("#signup-form").evaluate((form) => {
      form.setAttribute("novalidate", "");
    });
    await page.getByPlaceholder("이름을 입력해주세요").fill("홍");
    await page.getByPlaceholder("이메일을 입력해주세요").fill("not-an-email");
    await page.getByPlaceholder("예) 1995").fill("99");
    await page.getByRole("button", { name: "저장하기" }).click();
    await expect(page.getByText("한글 또는 영문으로 2자 이상 입력해주세요")).toBeVisible();
    await expect(page.getByText("유효한 이메일을 입력해주세요")).toBeVisible();
    await expect(page.getByText("4자리 연도를 입력해주세요")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("약관 동의(/terms/agree): 비로그인 시 동의 버튼이 비활성화된다", async ({
    page,
    pageErrors,
  }) => {
    await safeGoto(page, "/terms/agree?returnTo=/login");
    await expect(page.getByRole("heading", { name: "서비스 이용약관 동의" })).toBeVisible({
      timeout: 15_000,
    });
    // 필수 약관 미체크 상태에서는 동의 버튼이 비활성화된다.
    await expect(page.getByRole("button", { name: "동의하고 시작하기" })).toBeDisabled();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("anon이 공개 초대장에서 응답하면 로그인으로 유도되고 폼이 보존된다", async ({
    page,
  }) => {
    const id = await fetchInvitationIdAsDev(page, "host002@wara.dev");
    test.skip(!id, "시드 초대장이 없어 스킵");
    await safeGoto(page, `/i/${id}`);
    await expect(page.getByText("참석 여부")).toBeVisible();
    await page.getByRole("button", { name: "응답하기" }).click();
    await page.waitForURL(/\/login/, { timeout: 8000 });
    // 로그인 후 복귀 위치(returnUrl)와 RSVP 폼 임시저장이 보존되어야 한다.
    const { returnUrl, savedForm } = await page.evaluate((invId) => ({
      returnUrl: sessionStorage.getItem("returnUrl"),
      savedForm: sessionStorage.getItem(`rsvp_form_${invId}`),
    }), id);
    expect(returnUrl).toContain(id!);
    expect(savedForm).toBeTruthy();
  });
});

test.describe("2차 · 엣지", () => {
  test("비로그인 /profile 접근 시 로그인으로 리다이렉트된다", async ({ page, pageErrors }) => {
    await safeGoto(page, "/profile");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    await expect(page).toHaveURL(/returnTo=%2Fprofile|returnTo=\/profile/);
    expectNoPageErrors(pageErrors);
  });

  test("비로그인 /admin 접근 시 API 401 후 로그인으로 리다이렉트된다", async ({
    page,
    pageErrors,
  }) => {
    await safeGoto(page, "/admin");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
