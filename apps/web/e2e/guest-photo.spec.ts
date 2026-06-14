import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  findGuestInvitation,
  getOtherParticipantNames,
  mockGifTrending,
  MOCK_KLIPY_GIF_URL,
  openFirstPhotoViewer,
  openPhotoViewerComments,
} from "./helpers";

// 게스트 페르소나: 앨범 사진 상세 모달.
test.describe("guest-photo", () => {
  test.beforeEach(async () => {
    test.setTimeout(60_000);
  });

  test("앨범 사진 클릭 시 상세 모달과 댓글 패널이 열린다", async ({
    page,
    pageErrors,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");
    test.skip(!(await openFirstPhotoViewer(page, inv!.id)), "앨범에 사진이 없어 스킵");

    const viewer = await openPhotoViewerComments(page);
    const commentText = `E2E 사진댓글 ${Date.now()}`;
    await viewer.getByPlaceholder("댓글 남기기").fill(commentText);
    const postWait = page.waitForResponse(
      (r) =>
        r.url().includes("/photos/") &&
        r.url().includes("/feedbacks") &&
        r.request().method() === "POST" &&
        r.ok(),
      { timeout: 15_000 },
    );
    await viewer.getByLabel("댓글 등록").click();
    await postWait;
    await expect(viewer.getByText(commentText)).toBeVisible({ timeout: 15_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("사진 모달에서 멘션(@) 댓글을 등록할 수 있다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    // 멘션 자동완성은 이름(name) 기준 (닉네임 아님).
    const names = await getOtherParticipantNames(page, inv!.id);
    test.skip(names.length === 0, "멘션 대상 참가자가 없어 스킵");
    test.skip(!(await openFirstPhotoViewer(page, inv!.id)), "앨범에 사진이 없어 스킵");

    const targetName = names[0]!;
    const commentText = `E2E 사진멘션 ${Date.now()}`;
    const viewer = await openPhotoViewerComments(page);
    const input = viewer.getByPlaceholder("댓글 남기기");

    await input.fill(`@${targetName.slice(0, 2)}`);
    await viewer
      .getByRole("button")
      .filter({ hasText: `@${targetName}` })
      .first()
      .click({ timeout: 10_000 });
    await input.fill(`@${targetName} ${commentText}`);

    const postWait = page.waitForResponse(
      (r) =>
        r.url().includes("/photos/") &&
        r.url().includes("/feedbacks") &&
        r.request().method() === "POST" &&
        r.ok(),
      { timeout: 15_000 },
    );
    await viewer.getByLabel("댓글 등록").click();
    await postWait;

    const commentRow = viewer.locator("li").filter({ hasText: commentText }).first();
    await expect(commentRow).toBeVisible({ timeout: 15_000 });
    await expect(commentRow.locator(".mention-highlight")).toHaveText(`@${targetName}`);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("사진 모달에서 GIF 댓글을 등록할 수 있다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await mockGifTrending(page);
    test.skip(!(await openFirstPhotoViewer(page, inv!.id)), "앨범에 사진이 없어 스킵");

    const viewer = await openPhotoViewerComments(page);

    await viewer.getByRole("button", { name: "GIF 선택" }).click();
    await viewer
      .locator("button")
      .filter({ has: page.locator(`img[src="${MOCK_KLIPY_GIF_URL}"]`) })
      .click();
    await expect(viewer.getByLabel("GIF 제거")).toBeVisible();

    const commentText = `E2E 사진GIF ${Date.now()}`;
    await viewer.getByPlaceholder("댓글 남기기").fill(commentText);
    const postWait = page.waitForResponse(
      (r) =>
        r.url().includes("/photos/") &&
        r.url().includes("/feedbacks") &&
        r.request().method() === "POST" &&
        r.ok(),
      { timeout: 15_000 },
    );
    await viewer.getByLabel("댓글 등록").click();
    await postWait;

    await expect(viewer.getByText(commentText)).toBeVisible({ timeout: 15_000 });
    await expect(viewer.getByRole("img", { name: "GIF" }).first()).toBeVisible();
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("사진 모달 닫기 버튼으로 뷰어가 닫힌다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");
    test.skip(!(await openFirstPhotoViewer(page, inv!.id)), "앨범에 사진이 없어 스킵");

    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByRole("dialog", { name: "사진 뷰어" })).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
