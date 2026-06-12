import { expect, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import { expectNotCrashed, expectNoPageErrors } from "./fixtures";
import { API_BASE_URL } from "./personas";

export const TEST_IMAGE_PATH = path.join(__dirname, "fixtures", "test-image.png");

export const MOCK_KLIPY_GIF_URL = "https://static.klipy.com/e2e/test.gif";

/** Klipy API 없이 GIF picker를 채운다. */
export async function mockGifTrending(page: Page): Promise<void> {
  await page.route("**/api/gifs/trending**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        gifs: [
          {
            id: "e2e-mock",
            gifUrl: MOCK_KLIPY_GIF_URL,
            previewUrl: MOCK_KLIPY_GIF_URL,
          },
        ],
        hasNext: false,
      }),
    });
  });
}

export interface InvitationLite {
  id: string;
  title: string;
  status: string;
  myRole?: "HOST" | "GUEST";
  userId: string;
}

// page.request는 브라우저 컨텍스트의 쿠키(=페르소나 인증)를 공유한다.
export async function apiData<T>(page: Page, path: string): Promise<T | null> {
  const res = await page.request.get(path);
  if (!res.ok()) return null;
  const body = (await res.json()) as { data?: T };
  return body.data ?? null;
}

export async function getMyInvitations(page: Page): Promise<InvitationLite[]> {
  return (await apiData<InvitationLite[]>(page, "/api/invitations")) ?? [];
}

export async function findHostedInvitation(page: Page): Promise<InvitationLite | null> {
  const list = await getMyInvitations(page);
  return list.find((i) => i.myRole === "HOST") ?? list[0] ?? null;
}

export async function findGuestInvitation(page: Page): Promise<InvitationLite | null> {
  const list = await getMyInvitations(page);
  return list.find((i) => i.myRole === "GUEST") ?? list[0] ?? null;
}

export async function findGuestInvitationWithOpenPoll(
  page: Page,
): Promise<InvitationLite | null> {
  const guestInvitations = (await getMyInvitations(page)).filter(
    (i) => i.myRole === "GUEST",
  );
  for (const inv of guestInvitations) {
    const meRes = await page.request.get(
      `/api/invitations/${inv.id}/participants/me`,
    );
    if (!meRes.ok()) continue;
    const meBody = (await meRes.json()) as {
      data?: { participant?: { rsvpStatus?: string } };
    };
    if (meBody.data?.participant?.rsvpStatus === "absent") continue;

    const res = await page.request.get(`/api/invitations/${inv.id}/vote`);
    if (!res.ok()) continue;
    const body = (await res.json()) as { data?: { poll?: { status?: string } } };
    if (body.data?.poll?.status === "open") return inv;
  }
  return null;
}

/** 참여 중이며 투표가 종료(closed)되었거나 없는 게스트 초대장 */
export async function findGuestInvitationWithoutOpenPoll(
  page: Page,
): Promise<InvitationLite | null> {
  const guestInvitations = (await getMyInvitations(page)).filter(
    (i) => i.myRole === "GUEST",
  );
  for (const inv of guestInvitations) {
    const meRes = await page.request.get(
      `/api/invitations/${inv.id}/participants/me`,
    );
    if (!meRes.ok()) continue;
    const meBody = (await meRes.json()) as {
      data?: { participant?: { rsvpStatus?: string } };
    };
    if (meBody.data?.participant?.rsvpStatus === "absent") continue;

    const res = await page.request.get(`/api/invitations/${inv.id}/vote`);
    if (!res.ok()) return inv;
    const body = (await res.json()) as { data?: { poll?: { status?: string } } };
    if (body.data?.poll?.status !== "open") return inv;
  }
  return null;
}

// 클라이언트 리다이렉트(window.location.href / router.replace)는 진행 중인
// 네비게이션을 취소시켜 page.goto가 ERR_ABORTED를 던진다. 리다이렉트 자체는
// 정상 동작(예: 비로그인 → /login 가드)이므로 흡수하고, 최종 상태가 안착할
// 시간을 준 뒤 호출부가 not-crashed/URL을 검증하도록 한다.
export async function safeGoto(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path, { waitUntil: "domcontentloaded" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isClientRedirect =
      /ERR_ABORTED|frame was detached|interrupted by another navigation/i.test(msg);
    if (!isClientRedirect) throw err;
    await page.waitForLoadState("domcontentloaded").catch(() => {});
  }
}

/** domcontentloaded + (가능하면) networkidle까지 대기 */
export async function waitForPageSettled(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
}

/** 호스트 상세 TopAppBar의 더보기(댓글 더보기 버튼과 구분) */
export async function clickHostMoreButton(page: Page): Promise<void> {
  const btn = page.locator('header button[aria-label="더보기"]');
  await btn.waitFor({ state: "visible", timeout: 20_000 });
  await btn.click();
}

/** /vote 화면 데이터 로드 대기 (직접 /vote URL 진입 시 사용) */
export async function waitForVotePageData(
  page: Page,
  invitationId: string,
): Promise<void> {
  await page.waitForResponse(
    (r) =>
      r.url().includes(`/invitations/${invitationId}/vote`) &&
      r.request().method() === "GET" &&
      r.ok(),
    { timeout: 20_000 },
  );
}

/**
 * 호스트/게스트 상세의 VotePreviewCard 클릭 → /vote 이동 대기.
 * 상세 페이지 usePoll이 선행 GET /vote를 발생시키므로 waitForVotePageData만 쓰면 레이스가 난다.
 */
export async function openVoteFromPreviewCard(
  page: Page,
  invitationId: string,
): Promise<void> {
  const card = page.locator("button").filter({ hasText: "일정 투표" });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/후보 \d+개|진행 중|확정/, { timeout: 20_000 });

  await Promise.all([
    page.waitForURL(new RegExp(`/invitations/${invitationId}/vote(?:\\?|$)`), {
      timeout: 20_000,
    }),
    card.click(),
  ]);

  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await expect(page.getByRole("heading", { name: "일정 투표" }).or(
    page.locator("header").getByText("일정 투표", { exact: true }),
  )).toBeVisible({ timeout: 15_000 });
}

/** 브라우저 Date를 고정 (위치 공유 윈도우 E2E) */
export async function mockBrowserTime(page: Page, isoTime: string): Promise<void> {
  const fixed = new Date(isoTime).getTime();
  await page.addInitScript(`(() => {
    const fixed = ${fixed};
    const OriginalDate = Date;
    function FakeDate(...args) {
      if (args.length === 0) return new OriginalDate(fixed);
      return new OriginalDate(...args);
    }
    FakeDate.now = () => fixed;
    FakeDate.parse = OriginalDate.parse;
    FakeDate.UTC = OriginalDate.UTC;
    FakeDate.prototype = OriginalDate.prototype;
    window.Date = FakeDate;
  })()`);
}

export function kstEndOfDayIso(eventStartIso: string): string {
  const kstDate = new Date(eventStartIso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  return `${kstDate}T23:59:59+09:00`;
}

/** 지도 페이지 로드 + 행사 장소 API 완료 대기 */
export async function gotoLocationMap(
  page: Page,
  invitationId: string,
): Promise<void> {
  await page.goto(`/invitations/${invitationId}/location`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForResponse(
    (r) =>
      r.url().includes(`/invitations/${invitationId}/location`) &&
      r.request().method() === "GET" &&
      (r.ok() || r.status() === 404),
    { timeout: 20_000 },
  );
}

// 페이지를 열고, uncaught 예외/크래시 화면이 없는지 확인하는 기본 스모크.
export async function smokeVisit(
  page: Page,
  pageErrors: Error[],
  path: string,
): Promise<void> {
  await safeGoto(page, path);
  await waitForPageSettled(page);
  await expectNotCrashed(page);
  expectNoPageErrors(pageErrors);
}

// dev 토큰을 직접 발급(브라우저 쿠키 무관)해 시드 초대장 ID를 조회한다.
// anon 컨텍스트에서 "유효한 공개 초대장"이 필요한 테스트에 사용.
export async function fetchInvitationIdAsDev(
  page: Page,
  email: string,
): Promise<string | null> {
  const tokenRes = await page.request.post(`${API_BASE_URL}/api/auth/dev/token`, {
    data: { email },
  });
  if (!tokenRes.ok()) return null;
  const tokenBody = (await tokenRes.json()) as { data?: { accessToken?: string } };
  const token = tokenBody.data?.accessToken;
  if (!token) return null;

  const listRes = await page.request.get(`${API_BASE_URL}/api/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok()) return null;
  const listBody = (await listRes.json()) as { data?: InvitationLite[] };
  return listBody.data?.[0]?.id ?? null;
}

export async function getFriends(
  page: Page,
): Promise<{ id: string; name: string | null }[]> {
  const data = await apiData<{ friends: { id: string; name: string | null }[] }>(
    page,
    "/api/friends",
  );
  return data?.friends ?? [];
}

export async function getOtherParticipantNicknames(
  page: Page,
  invitationId: string,
): Promise<string[]> {
  const me = await apiData<{ id: string; nickname?: string | null }>(page, "/api/users/me");
  const data = await apiData<{
    participants: { user: { id: string; nickname?: string | null } }[];
  }>(page, `/api/invitations/${invitationId}/participants`);
  if (!data?.participants) return [];
  return data.participants
    .filter((p) => p.user.id !== me?.id && !!p.user.nickname)
    .map((p) => p.user.nickname!);
}

export async function getInvitationPhotos(
  page: Page,
  invitationId: string,
): Promise<{ rows: { id: string }[]; total: number } | null> {
  return apiData(page, `/api/invitations/${invitationId}/photos?limit=5`);
}

/** 앨범 첫 사진 → PhotoDetailModal. 사진 없으면 false. */
export async function openFirstPhotoViewer(
  page: Page,
  invitationId: string,
): Promise<boolean> {
  const photos = await getInvitationPhotos(page, invitationId);
  if (!photos?.rows?.length) return false;

  await page.goto(`/invitations/${invitationId}`, { waitUntil: "domcontentloaded" });
  const albumHeading = page.getByText("사진 앨범");
  await albumHeading.waitFor({ state: "visible", timeout: 20_000 });
  await albumHeading.scrollIntoViewIfNeeded();
  await page
    .locator("button")
    .filter({ has: page.locator("img") })
    .first()
    .click();
  await page.getByRole("button", { name: "닫기" }).waitFor({ state: "visible", timeout: 10_000 });
  return true;
}

/** PhotoViewer 모달에서 댓글 패널을 연다. */
export async function openPhotoViewerComments(page: Page) {
  await page.getByRole("button", { name: "댓글 보기" }).click();
  await page.getByRole("button", { name: "댓글 접기" }).waitFor({ state: "visible" });
  return page.getByRole("dialog", { name: "사진 뷰어" });
}

/** `/i/:id` 진입 후 클라이언트 리다이렉트가 안착할 때까지 대기 */
export async function waitForPublicLinkRedirect(
  page: Page,
  invitationId: string,
  options: { hasOpenPoll: boolean; timeout?: number },
): Promise<void> {
  const timeout = options.timeout ?? 20_000;
  if (options.hasOpenPoll) {
    const votePath = `/invitations/${invitationId}/vote`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page.waitForURL(new RegExp(votePath), { timeout });
    return;
  }
  await page.waitForURL(new RegExp(`/invitations/${invitationId}(?!/vote)`), { timeout });
}

/** 친구 화면 채팅 탭 */
export async function openChatTab(page: Page): Promise<void> {
  await page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "채팅" })).toBeVisible();
}

/** DM 채팅방 진입 + 메시지 목록 API 완료 대기 */
export async function gotoChatRoom(page: Page, conversationId: string): Promise<void> {
  const messagesPromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/conversations/${conversationId}/messages`) &&
      res.request().method() === "GET" &&
      res.ok(),
    { timeout: 20_000 },
  );
  await page.goto(`/chats/${conversationId}`, { waitUntil: "domcontentloaded" });
  await messagesPromise.catch(() => {});
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 15_000 });
}

/** ChatRoom 길게 누르기 (pointer 500ms) */
export async function longPress(locator: Locator, ms = 550): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("longPress: element has no bounding box");
  const page = locator.page();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** API 요청을 mock 실패로 고정한다 (2차 엣지·에러 UI 검증용). */
export async function mockApiRouteFailure(
  page: Page,
  urlPattern: string | RegExp,
  options?: { method?: string; status?: number; message?: string },
): Promise<void> {
  const method = options?.method?.toUpperCase();
  const status = options?.status ?? 500;
  await page.route(urlPattern, async (route) => {
    if (method && route.request().method() !== method) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { message: options?.message ?? "E2E mock failure" },
      }),
    });
  });
}
