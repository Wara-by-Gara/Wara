import { test, expect, expectNotCrashed, meaningfulConsoleErrors } from "./fixtures";
import { mockApiRouteFailure } from "./helpers";
import { authFile } from "./personas";
import type { Browser, Page, Locator } from "@playwright/test";

// DM 실시간 테스트 — 두 유저가 친구여야 친구 프로필에서 1:1 채팅을 시작할 수 있다.
// host001(newHost) <-> guest001(guest) 는 같은 모임 참여(=친구). 시드 고정 id.
const GUEST001_ID = "P6NG7VXYRZ2R4D7VHV55B8MT80"; // guest001@wara.dev
const MSG_INPUT = "메시지를 입력하세요";

async function openAs(browser: Browser, persona: "newHost" | "guest") {
  const context = await browser.newContext({ storageState: authFile(persona) });
  const page = await context.newPage();
  return { context, page };
}

// 페이지에서 발생한 429 응답을 수집 (rate limit 회귀 감시)
function track429(page: Page): number[] {
  const hits: number[] = [];
  page.on("response", (r) => {
    if (r.status() === 429) hits.push(429);
  });
  return hits;
}

// host(newHost)가 guest 친구 프로필에서 1:1 채팅을 시작하고 대화방 경로를 반환한다.
async function hostEnterDmWithGuest(page: Page): Promise<string> {
  await page.goto(`/friends/${GUEST001_ID}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "1:1 채팅" }).click();
  await page.waitForURL(/\/chats\/[A-Za-z0-9]+/, { timeout: 15_000 });
  return new URL(page.url()).pathname;
}

async function send(page: Page, text: string) {
  await page.getByPlaceholder(MSG_INPUT).fill(text);
  await page.getByLabel("전송").click();
}

// 페이지의 uncaught 예외 / console.error 수집 (두 컨텍스트 테스트는 fixture를 못 써 수동 수집)
function collectErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  return { pageErrors, consoleErrors };
}

// 메시지 말풍선 길게 누르기 -> 메뉴 모달 (LONG_PRESS_MS=500ms 보다 길게 hold)
async function longPress(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error("longPress: 대상 boundingBox 없음");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
}

test.describe("dm-batch1", () => {
  test("친구 프로필에서 1:1 채팅으로 진입하고, 재진입 시 같은 방이다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    const path1 = await hostEnterDmWithGuest(page);
    expect(path1).toMatch(/^\/chats\//);
    await expect(page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    // createOrGet 멱등: 다시 친구 프로필에서 들어가도 같은 방
    const path2 = await hostEnterDmWithGuest(page);
    expect(path2).toBe(path1);

    await expectNotCrashed(page);
    await context.close();
  });

  test("메시지를 보내면 내 화면에 바로 표시된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const msg = `E2E 전송 ${Date.now()}`;
    await send(page, msg);

    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test("상대가 같은 방에 있으면 메시지를 실시간 수신한다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    const msg = `E2E 실시간 ${Date.now()}`;
    await send(host.page, msg);

    // 소켓으로 상대 화면에 새로고침 없이 도착
    await expect(guest.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("연달아 보내도 모두 순서대로 도착하고 429가 없다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");
    const host429 = track429(host.page);
    const guest429 = track429(guest.page);

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    const stamp = Date.now();
    const msgs = Array.from({ length: 5 }, (_, i) => `E2E 연타 ${stamp}-${i}`);
    for (const m of msgs) await send(host.page, m);

    // 5개 모두 상대 화면에 도착
    for (const m of msgs) {
      await expect(guest.page.getByText(m)).toBeVisible({ timeout: 12_000 });
    }
    // 순서: 마지막 메시지가 이전 메시지들보다 뒤(아래)에 있다
    const firstBox = await guest.page.getByText(msgs[0]!).boundingBox();
    const lastBox = await guest.page.getByText(msgs[msgs.length - 1]!).boundingBox();
    expect(firstBox && lastBox && lastBox.y > firstBox.y).toBeTruthy();

    expect(host429, "host 429 발생").toEqual([]);
    expect(guest429, "guest 429 발생").toEqual([]);

    await host.context.close();
    await guest.context.close();
  });

  test("상대가 방 밖이면 채팅 목록에 안읽음이 뜨고, 입장하면 사라진다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    await hostEnterDmWithGuest(host.page);
    // guest는 채팅 목록(방 밖)에 머문다
    await guest.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });

    const msg = `E2E 안읽음 ${Date.now()}`;
    await send(host.page, msg);

    // 해당 대화 행이 미리보기 텍스트와 함께 뜨고, 안읽음 빨간 배지가 보인다
    const row = guest.page.locator("li", { hasText: msg });
    await expect(row).toBeVisible({ timeout: 12_000 });
    await expect(row.locator(".bg-red-500")).toBeVisible();

    // 입장 -> 읽음 처리 -> 목록 복귀 시 배지 사라짐
    await row.click();
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();
    await guest.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });
    const rowAfter = guest.page.locator("li", { hasText: msg });
    await expect(rowAfter).toBeVisible({ timeout: 12_000 });
    await expect(rowAfter.locator(".bg-red-500")).toHaveCount(0, { timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });
});

test.describe("dm-batch2", () => {
  test("빈 메시지는 전송 버튼이 비활성이고, 입력하면 활성화된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    await expect(page.getByLabel("전송")).toBeDisabled();
    await page.getByPlaceholder(MSG_INPUT).fill("a");
    await expect(page.getByLabel("전송")).toBeEnabled();

    await context.close();
  });

  test("입력창 maxLength=2000이고 한도 근처에서 글자수 카운터가 보인다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const input = page.getByPlaceholder(MSG_INPUT);
    await expect(input).toHaveAttribute("maxlength", "2000");
    await input.fill("가".repeat(1950));
    await expect(page.getByText("1950/2000")).toBeVisible();

    await context.close();
  });

  test("Enter 키로 메시지를 보낼 수 있다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const msg = `E2E Enter ${Date.now()}`;
    await page.getByPlaceholder(MSG_INPUT).fill(msg);
    await page.getByPlaceholder(MSG_INPUT).press("Enter");

    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test("내 메시지를 길게 누르면 복사/답장/수정/삭제 메뉴가 나온다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const msg = `E2E 메뉴 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible();

    await longPress(page, page.getByText(msg));
    await expect(page.getByRole("button", { name: "복사" })).toBeVisible();
    await expect(page.getByRole("button", { name: "답장" })).toBeVisible();
    await expect(page.getByRole("button", { name: "수정" })).toBeVisible();
    await expect(page.getByRole("button", { name: "삭제" })).toBeVisible();

    await context.close();
  });

  test("상대 메시지를 길게 누르면 수정/삭제 없이 복사/답장만 있다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    const msg = `E2E 상대메뉴 ${Date.now()}`;
    await send(guest.page, msg);
    await expect(host.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(msg));
    await expect(host.page.getByRole("button", { name: "복사" })).toBeVisible();
    await expect(host.page.getByRole("button", { name: "답장" })).toBeVisible();
    await expect(host.page.getByRole("button", { name: "수정" })).toHaveCount(0);
    await expect(host.page.getByRole("button", { name: "삭제" })).toHaveCount(0);

    await host.context.close();
    await guest.context.close();
  });

  test("메시지를 수정하면 양쪽 화면에 반영된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });

    const orig = `E2E 원본 ${Date.now()}`;
    await send(host.page, orig);
    await expect(guest.page.getByText(orig)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(orig));
    await host.page.getByRole("button", { name: "수정" }).click();
    const edited = `E2E 수정됨 ${Date.now()}`;
    await host.page.getByPlaceholder("수정 메시지 입력").fill(edited);
    await host.page.getByLabel("수정 완료").click();

    await expect(host.page.getByText(edited)).toBeVisible({ timeout: 10_000 });
    await expect(guest.page.getByText(edited)).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("메시지를 삭제하면 양쪽에 '삭제된 메시지'로 표시된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });

    const msg = `E2E 삭제대상 ${Date.now()}`;
    await send(host.page, msg);
    await expect(guest.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(msg));
    await host.page.getByRole("button", { name: "삭제" }).click();
    // 확인 모달이 열린 뒤 확인 버튼 클릭
    await expect(host.page.getByText("이 메시지를 삭제하면 상대방 화면에서도 사라집니다.")).toBeVisible();
    await host.page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();

    await expect(host.page.getByText("삭제된 메시지입니다")).toBeVisible({ timeout: 10_000 });
    await expect(guest.page.getByText(/삭제된 메시지/)).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("답장하면 인용 미리보기가 뜨고, 보낸 답장에 원본 인용이 표시된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const orig = `E2E 답장원본 ${Date.now()}`;
    await send(page, orig);
    await expect(page.getByText(orig)).toBeVisible();

    await longPress(page, page.getByText(orig));
    await page.getByRole("button", { name: "답장" }).click();
    // 입력창 위에 "...에게 답장" 인용 배너
    await expect(page.getByText(/에게 답장/)).toBeVisible();

    const reply = `E2E 답장내용 ${Date.now()}`;
    await send(page, reply);
    await expect(page.getByText(reply)).toBeVisible({ timeout: 10_000 });
    // 원본 텍스트가 2곳(원본 말풍선 + 답장 말풍선 인용)에 보인다
    await expect(page.getByText(orig)).toHaveCount(2, { timeout: 10_000 });

    await context.close();
  });
});

test.describe("dm-batch3", () => {
  test("채팅방 헤더의 상대 이름을 누르면 친구 프로필로 이동한다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    // 헤더 이름 버튼이 DOM상 첫 "프로필 보기" (말풍선 아바타보다 앞)
    await page.getByRole("button", { name: /프로필 보기/ }).first().click();
    await page.waitForURL(new RegExp(`/friends/${GUEST001_ID}`), { timeout: 10_000 });
    await expect(page.getByRole("button", { name: "1:1 채팅" })).toBeVisible();

    await context.close();
  });

  test("전송 실패 시 토스트가 뜨고 입력 내용이 복원된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    // 메시지 전송(POST) 엔드포인트만 실패시킨다
    await mockApiRouteFailure(page, /\/api\/conversations\/[^/]+\/messages/, {
      method: "POST",
      status: 500,
    });

    const msg = `E2E 전송실패 ${Date.now()}`;
    await page.getByPlaceholder(MSG_INPUT).fill(msg);
    await page.getByLabel("전송").click();

    await expect(page.getByText(/보내지 못했어요/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(MSG_INPUT)).toHaveValue(msg);

    await context.close();
  });

  test("DM 흐름에서 크래시/유의미한 콘솔 에러가 없다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");
    const hostErr = collectErrors(host.page);
    const guestErr = collectErrors(guest.page);

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await send(host.page, `E2E 스모크 ${Date.now()}`);
    await guest.page.waitForTimeout(600);
    await host.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });

    await expectNotCrashed(host.page);
    await expectNotCrashed(guest.page);
    expect(hostErr.pageErrors, "host uncaught 예외").toEqual([]);
    expect(guestErr.pageErrors, "guest uncaught 예외").toEqual([]);
    expect(meaningfulConsoleErrors(hostErr.consoleErrors), "host 콘솔 에러").toEqual([]);
    expect(meaningfulConsoleErrors(guestErr.consoleErrors), "guest 콘솔 에러").toEqual([]);

    await host.context.close();
    await guest.context.close();
  });
});
