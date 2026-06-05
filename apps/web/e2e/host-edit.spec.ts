import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import { clickHostMoreButton, findHostedInvitation } from "./helpers";

// 호스트 페르소나: 초대장 수정(/edit).
test.describe("host-edit", () => {
  test("호스트 더보기 → 수정 진입 시 편집 화면이 렌더된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "호스트 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await clickHostMoreButton(page);
    await expect(page.getByRole("button", { name: "초대 마감" })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.waitForURL(new RegExp(`/invitations/${inv!.id}/edit`), { timeout: 15_000 });
    await expect(page.getByText("초대장 수정", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("예: 와라의 생일 파티")).toHaveValue(inv!.title);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("제목 수정 후 저장하면 상세에 반영된다", async ({ page, pageErrors }) => {
    test.setTimeout(60_000);
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "호스트 초대장이 없어 스킵");

    const newTitle = `E2E 수정 ${Date.now()}`;
    await page.goto(`/invitations/${inv!.id}/edit`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("예: 와라의 생일 파티").waitFor({
      state: "visible",
      timeout: 20_000,
    });

    await page.getByPlaceholder("예: 와라의 생일 파티").fill(newTitle);
    await page.getByRole("button", { name: "저장" }).first().click();
    await expect(page.getByText("변경사항을 저장할까요?")).toBeVisible();

    const patchWait = page.waitForResponse(
      (r) =>
        r.url().includes(`/invitations/${inv!.id}`) &&
        !r.url().includes("/photos/") &&
        r.request().method() === "PATCH" &&
        r.ok(),
      { timeout: 20_000 },
    );
    await page.getByRole("dialog").getByRole("button", { name: "저장" }).click();
    await patchWait;

    await expect(page).toHaveURL(new RegExp(`/invitations/${inv!.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: newTitle })).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("빈 제목 저장 시 확인 모달 없이 검증 에러가 표시된다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findHostedInvitation(page);
    test.skip(!inv, "호스트 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/edit`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("예: 와라의 생일 파티").waitFor({
      state: "visible",
      timeout: 20_000,
    });
    await page.getByPlaceholder("예: 와라의 생일 파티").fill("");
    await page.getByRole("button", { name: "저장" }).first().click();

    await expect(page.getByText("모임 이름을 입력해주세요")).toBeVisible();
    await expect(page.getByText("변경사항을 저장할까요?")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("존재하지 않는 초대장 수정 페이지는 에러 UI를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/invitations/00000000000000000000000000/edit", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await expect(page.getByText("초대장을 불러올 수 없어요")).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
