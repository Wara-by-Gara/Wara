import { test, expect, expectNotCrashed } from "./fixtures";
import { authFile } from "./personas";
import type { Browser, Page } from "@playwright/test";

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
    const firstBox = await guest.page.getByText(msgs[0]).boundingBox();
    const lastBox = await guest.page.getByText(msgs[4]).boundingBox();
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
