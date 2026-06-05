import { test, expect, expectNoPageErrors, expectNotCrashed } from "./fixtures";
import {
  apiData,
  findGuestInvitation,
  findGuestInvitationWithOpenPoll,
  findGuestInvitationWithoutOpenPoll,
  safeGoto,
  waitForPublicLinkRedirect,
} from "./helpers";

// 게스트 페르소나 엣지케이스: 문의 폼 검증/제출, 중복 참여 리다이렉트.
test.describe("guest-edge", () => {
  test("문의 작성: 제목/내용이 비면 제출되지 않고 크래시도 없다", async ({
    page,
    pageErrors,
  }) => {
    await page.goto("/inquiries/write", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    // 빈 폼으로 보내기 → 제출 무시(no-op), 페이지 그대로 유지.
    await page.getByRole("button", { name: "보내기" }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/inquiries\/write/);
    await expect(page.getByText("문의가 접수됐어요")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("문의 작성: 유효 입력 시 접수 모달이 뜬다", async ({ page, pageErrors }) => {
    await page.goto("/inquiries/write", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByPlaceholder("제목을 입력해주세요").fill("E2E 자동 문의 테스트");
    await page
      .getByPlaceholder("문의하고 싶은 내용을 입력해주세요.")
      .fill("E2E 테스트로 생성된 문의입니다. 무시해주세요.");
    const submitWait = page.waitForResponse(
      (r) => r.url().includes("/api/inquiries") && r.request().method() === "POST" && r.ok(),
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "보내기" }).click();
    await submitWait;
    await expect(page.getByText("문의가 접수됐어요")).toBeVisible({ timeout: 10_000 });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });

  test("이미 참여한 초대장의 공개 링크(/i/:id)는 투표 상태에 맞는 화면으로 리다이렉트된다", async ({
    page,
  }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    const me = await apiData<{ participant: { rsvpStatus: string } | null }>(
      page,
      `/api/invitations/${inv!.id}/participants/me`,
    );
    const status = me?.participant?.rsvpStatus;
    test.skip(!status || status === "absent", "참여 상태가 아니라 리다이렉트 대상 아님");

    const pollRes = await page.request.get(`/api/invitations/${inv!.id}/vote`);
    const hasOpenPoll = pollRes.ok()
      ? ((await pollRes.json()) as { data?: { poll?: { status?: string } } }).data?.poll
          ?.status === "open"
      : false;

    await safeGoto(page, `/i/${inv!.id}`);
    await waitForPublicLinkRedirect(page, inv!.id, { hasOpenPoll });
    const targetPath = hasOpenPoll
      ? `/invitations/${inv!.id}/vote`
      : `/invitations/${inv!.id}`;
    await expect(page).toHaveURL(new RegExp(targetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("공개 링크(/i/:id) 진입 시 진행 중 투표가 있으면 투표 화면으로 이동한다", async ({
    page,
  }) => {
    const inv = await findGuestInvitationWithOpenPoll(page);
    test.skip(!inv, "진행 중 투표가 있는 게스트 초대장이 없어 스킵");

    await safeGoto(page, `/i/${inv!.id}`);
    await waitForPublicLinkRedirect(page, inv!.id, { hasOpenPoll: true });
    await expect(page).toHaveURL(new RegExp(`/invitations/${inv!.id}/vote`));
  });

  test("공개 링크(/i/:id) 진입 시 투표가 없거나 종료됐으면 상세 화면으로 이동한다", async ({
    page,
  }) => {
    const inv = await findGuestInvitationWithoutOpenPoll(page);
    test.skip(!inv, "open poll이 없는 게스트 초대장이 없어 스킵");

    await safeGoto(page, `/i/${inv!.id}`);
    await waitForPublicLinkRedirect(page, inv!.id, { hasOpenPoll: false });
    await expect(page).toHaveURL(new RegExp(`/invitations/${inv!.id}$`));
  });

  test("게스트는 초대장 수정 저장 시 실패 UI가 표시된다", async ({ page, pageErrors }) => {
    const inv = await findGuestInvitation(page);
    test.skip(!inv, "참여 중인 초대장이 없어 스킵");

    await page.goto(`/invitations/${inv!.id}/edit`, { waitUntil: "domcontentloaded" });
    const titleInput = page.getByPlaceholder("예: 와라의 생일 파티");
    await titleInput.waitFor({ state: "visible", timeout: 20_000 });

    await titleInput.fill(`E2E 게스트수정 ${Date.now()}`);
    await page.getByRole("button", { name: "저장" }).first().click();
    await expect(page.getByText("변경사항을 저장할까요?")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("변경사항 저장에 실패했어요")).toBeVisible({
      timeout: 15_000,
    });
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("2차 · 엣지", () => {
  test("문의 작성: 제목만 입력하면 제출되지 않는다", async ({ page, pageErrors }) => {
    await page.goto("/inquiries/write", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByPlaceholder("제목을 입력해주세요").fill("E2E 제목만 테스트");
    await page.getByRole("button", { name: "보내기" }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/inquiries\/write/);
    await expect(page.getByText("문의가 접수됐어요")).toHaveCount(0);
    await expectNotCrashed(page);
    expectNoPageErrors(pageErrors);
  });
});
