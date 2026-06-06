import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  findGuestInvitation,
  getOtherParticipantNicknames,
  mockApiRouteFailure,
  mockGifTrending,
  MOCK_KLIPY_GIF_URL,
} from "./helpers";

// 게스트 페르소나: 댓글/답글 페이지 및 초대장 피드백.
test.describe("guest-comments", () => {
  test("댓글 전용 페이지가 크래시 없이 렌더된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await expectNotCrashed(page);
    await expect(page.getByText("댓글을 불러오지 못했어요")).toHaveCount(0);
    expectNoPageErrors(pageErrors);
  });

  test("빈 댓글 제출은 no-op이고 크래시하지 않는다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);

    // 입력이 비어 있으면 전송 버튼이 disabled — no-op이 정상 동작.
    await expect(page.getByLabel("댓글 등록")).toBeDisabled();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글 작성 후 목록에 반영된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const commentText = `E2E 댓글 ${Date.now()}`;
    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);

    await page.getByPlaceholder("댓글 남기기").fill(commentText);
    await page.getByLabel("댓글 등록").click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글에 답글을 달 수 있다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const parentText = `E2E 부모댓글 ${Date.now()}`;
    const replyText = `E2E 답글 ${Date.now()}`;
    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);

    await page.getByPlaceholder("댓글 남기기").fill(parentText);
    await page.getByLabel("댓글 등록").click();
    const parentRow = page.locator("div.px-4").filter({ hasText: parentText }).first();
    await expect(parentRow).toBeVisible({ timeout: 10_000 });
    await parentRow.getByRole("button", { name: "답글 달기" }).click();
    const replyInput = page.getByPlaceholder(/에게 답글/);
    await expect(replyInput).toBeVisible({ timeout: 5_000 });
    await replyInput.fill(replyText);
    await page.getByLabel("댓글 등록").click();
    await expect(page.getByText(replyText)).toBeVisible({ timeout: 10_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("내 댓글 수정·삭제 UI가 동작한다", async ({ page, pageErrors }) => {
    test.setTimeout(60_000);
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const original = `E2E 수정대상 ${Date.now()}`;
    const edited = `${original}-수정됨`;
    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByPlaceholder("댓글 남기기").waitFor({ state: "visible", timeout: 20_000 });

    await page.getByPlaceholder("댓글 남기기").fill(original);
    const postWait = page.waitForResponse(
      (r) =>
        r.url().includes(`/invitations/${inv!.id}/feedbacks`) &&
        !r.url().includes("/photos/") &&
        r.request().method() === "POST" &&
        r.ok(),
      { timeout: 15_000 },
    );
    await page.getByLabel("댓글 등록").click();
    await postWait;

    await expect(page.getByText(original, { exact: true })).toBeVisible({ timeout: 15_000 });
    const commentRow = page
      .locator('[class*="px-4"]')
      .filter({ has: page.getByText(original, { exact: true }) })
      .first();

    await commentRow.getByLabel("더보기").click();
    const editButton = page.getByRole("button", { name: "수정" });
    await expect(editButton).toBeVisible({ timeout: 5_000 });
    await editButton.click();

    const editInput = page.locator("main input").first();
    await expect(editInput).toBeVisible({ timeout: 5_000 });
    await editInput.fill(edited);

    const patchWait = page.waitForResponse(
      (r) =>
        r.url().includes("/feedbacks/") &&
        !r.url().includes("/photos/") &&
        r.request().method() === "PATCH" &&
        r.ok(),
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await patchWait;

    const editedRow = page
      .locator('[class*="px-4"]')
      .filter({ has: page.getByText(edited, { exact: true }) })
      .first();
    await expect(editedRow).toBeVisible({ timeout: 15_000 });
    await editedRow.getByLabel("더보기").click();
    await page.getByRole("button", { name: "삭제" }).click();
    await expect(page.getByText("이 댓글을 삭제할까요?")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText(edited)).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글 전용 페이지에는 GIF 선택 UI가 없다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/comments`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await expect(page.getByRole("button", { name: "GIF 선택" })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("초대장 상세에서 멘션(@) 댓글을 등록할 수 있다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const nicknames = await getOtherParticipantNicknames(page, inv!.id);
    test.skip(nicknames.length === 0, "멘션 대상 참가자가 없어 스킵");
    const targetNickname = nicknames[0]!;

    const commentText = `E2E 멘션 ${Date.now()}`;
    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.getByRole("heading", { name: /^댓글 \d+/ }).scrollIntoViewIfNeeded();

    const input = page.getByPlaceholder("댓글 남기기").first();
    await input.fill(`@${targetNickname.slice(0, 2)}`);
    await page
      .locator("div.rounded-2xl.border.border-border.bg-surface.shadow-sm ul")
      .getByRole("button", { name: `@${targetNickname}` })
      .first()
      .click();
    await input.fill(`@${targetNickname} ${commentText}`);

    const submit = page.getByLabel("댓글 등록").first();
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/invitations/${inv!.id}/feedbacks`) &&
          r.request().method() === "POST" &&
          r.ok(),
      ),
      submit.click(),
    ]);

    const commentRow = page.locator("div.px-4").filter({ hasText: commentText }).first();
    await expect(commentRow).toBeVisible({ timeout: 15_000 });
    await expect(commentRow.locator(".mention-highlight")).toHaveText(`@${targetNickname}`);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("초대장 상세에서 GIF 댓글을 등록할 수 있다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await mockGifTrending(page);
    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.getByRole("heading", { name: /^댓글 \d+/ }).scrollIntoViewIfNeeded();

    await page.getByRole("button", { name: "GIF 선택" }).first().click();
    await page.locator(`img[src="${MOCK_KLIPY_GIF_URL}"]`).first().click();
    await expect(page.getByLabel("GIF 제거")).toBeVisible();

    const commentText = `E2E GIF댓글 ${Date.now()}`;
    await page.getByPlaceholder("댓글 남기기").first().fill(commentText);
    await page.getByLabel("댓글 등록").first().click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("img", { name: "GIF" }).first()).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("초대장 상세에서 댓글 좋아요 토글이 크래시 없이 동작한다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const commentText = `E2E 좋아요 ${Date.now()}`;
    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.getByRole("heading", { name: /^댓글 \d+/ }).scrollIntoViewIfNeeded();

    await page.getByPlaceholder("댓글 남기기").first().fill(commentText);
    await page.getByLabel("댓글 등록").first().click();
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 });

    const commentRow = page.locator("div.px-4").filter({ hasText: commentText }).first();
    const likeButton = commentRow.locator("div.flex.items-center.gap-3 button").last();
    await likeButton.click();
    await page.waitForTimeout(500);
    await likeButton.click();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("멘션 검색에 일치하는 참가자가 없으면 안내 문구를 보여준다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.getByRole("heading", { name: /^댓글 \d+/ }).scrollIntoViewIfNeeded();

    await page.getByPlaceholder("댓글 남기기").first().fill("@zzzzzzzzzzz");
    await expect(page.getByText("일치하는 참가자 없음").first()).toBeVisible({
      timeout: 10_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("댓글 목록 API 실패 시 ErrorState를 보여준다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await mockApiRouteFailure(page, "**/api/invitations/*/feedbacks/all**", {
      method: "GET",
    });
    await page.goto(`/invitations/${inv!.id}/comments`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.getByText("댓글을 불러오지 못했어요")).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
