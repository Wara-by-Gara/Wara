import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { findHostedInvitation, smokeVisit } from "./helpers";

// 신규 호스트 페르소나: 홈/생성/호스트 상세.
test.describe("newHost", () => {
  test("홈 + 초대장 생성 페이지 스모크", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/안녕하세요/)).toBeVisible();
    // 생성 wizard는 active edit 영역과 겹치므로 크래시 여부만 확인.
    await smokeVisit(page, pageErrors, "/invitations/create");
  });

  test("호스트 초대장 상세가 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "보유한 초대장이 없어 스킵");
    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    await expect(page.getByText("초대장을 불러오지 못했어요")).toHaveCount(0);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("빈 제목으로 제출하면 검증 에러가 표시된다", async ({ page, pageErrors }) => {
    await page.goto("/invitations/create", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await page.getByText("모임 날짜").scrollIntoViewIfNeeded();
    await page
      .locator("label")
      .filter({ hasText: "아직 정해지지 않았어요" })
      .first()
      .getByRole("switch")
      .click();
    await page
      .locator("label")
      .filter({ hasText: "아직 정해지지 않았어요" })
      .nth(1)
      .getByRole("switch")
      .click();

    await page.getByRole("button", { name: "초대장 만들기" }).click();
    await expect(page.getByText("모임 이름을 입력해주세요")).toBeVisible();
    await expect(page.getByText("초대장을 만들까요?")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
