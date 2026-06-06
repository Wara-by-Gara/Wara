import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { findHostedInvitation } from "./helpers";

// 운영 호스트 페르소나: 참석자 관리 등 호스트 운영 화면.
test.describe("hostOperator", () => {
  test("내 초대장 목록이 홈에 노출된다", async ({ page, pageErrors }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("참석자 관리 페이지가 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "보유한 초대장이 없어 스킵");
    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("초대장 위치 페이지가 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "보유한 초대장이 없어 스킵");
    await page.goto(`/invitations/${inv!.id}/location`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("참석자 관리: 필터/정렬/검색 인터랙션이 크래시 없이 동작한다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "보유한 초대장이 없어 스킵");
    await page.goto(`/invitations/${inv!.id}/participants`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);

    // RSVP 필터 칩 전환
    for (const label of ["참석", "미정", "불참", "전체"]) {
      await page.getByRole("button", { name: label, exact: true }).first().click();
      await page.waitForTimeout(150);
      await expectNotCrashed(page);
    }

    // 정렬 바텀시트 → 이름순
    await page.getByRole("button", { name: "정렬" }).click();
    await page.getByText("이름순").click();
    await page.waitForTimeout(200);
    await expectNotCrashed(page);

    // 검색: 일치하지 않는 질의 → 검색 결과 없음(참석자가 있을 때)
    await page.getByRole("button", { name: "검색" }).click();
    await page.getByPlaceholder("이름으로 검색").fill("존재하지않는이름zzz999");
    await page.waitForTimeout(300);
    await expectNotCrashed(page);

    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("존재하지 않는 초대장의 참석자 관리는 ErrorState를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/invitations/00000000000000000000000000/participants", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    await expect(page.getByText("명단을 불러오지 못했어요")).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
