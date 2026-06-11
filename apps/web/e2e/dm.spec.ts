import { test, expect, expectNotCrashed, meaningfulConsoleErrors } from "./fixtures";
import { mockApiRouteFailure } from "./helpers";
import { authFile } from "./personas";
import type { Browser, Page, Locator } from "@playwright/test";

// DM 실시간 테스트 — 두 유저가 친구여야 친구 프로필에서 1:1 채팅을 시작할 수 있다.
// host001(newHost) <-> guest001(guest) 는 같은 모임 참여(=친구). 시드 고정 id.
const GUEST001_ID = "P6NG7VXYRZ2R4D7VHV55B8MT80"; // guest001@wara.dev
const GUEST002_ID = "C6K2N2V2V63RGX3Z1RTMSC0EFN"; // guest002@wara.dev (host001과 친구)
const HOST001_ID = "CHH1HEK72R2RH21YWJTXXM99TC"; // host001@wara.dev (self)
const GUEST002_NAME = "송지안"; // guest002@wara.dev 시드 표시 이름 (초대 피커 선택용)
const MSG_INPUT = "메시지를 입력하세요";

// host(newHost)가 임의의 친구(targetId)와 1:1 채팅에 진입해 경로를 반환
async function hostEnterDmWith(page: Page, targetId: string): Promise<string> {
  await page.goto(`/friends/${targetId}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "1:1 채팅" }).click();
  await page.waitForURL(/\/chats\/[A-Za-z0-9]+/, { timeout: 15_000 });
  return new URL(page.url()).pathname;
}

async function openAs(browser: Browser, persona: "newHost" | "guest" | "guest2") {
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
  // 새 메시지 도착으로 스크롤이 흔들릴 수 있어 위치를 안정화하고,
  // hover로 포인터를 요소 중심에 확실히 올린 뒤 길게 누른다 (LONG_PRESS_MS=500ms).
  await target.scrollIntoViewIfNeeded();
  // 실시간 수신으로 인한 자동 스크롤/리렌더가 끝나도록 충분히 대기 후 좌표를 잡는다.
  await page.waitForTimeout(400);
  await target.hover();
  await page.mouse.down();
  await page.waitForTimeout(700);
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

    await expect(host.page.getByText("삭제된 메시지입니다").first()).toBeVisible({ timeout: 10_000 });
    await expect(guest.page.getByText(/삭제된 메시지/).first()).toBeVisible({ timeout: 10_000 });

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

test.describe("dm-batch4-adversarial", () => {
  test("참여하지 않은 대화방의 메시지는 볼 수 없다 (접근 차단)", async ({ browser }) => {
    const host = await openAs(browser, "newHost"); // host001
    const outsider = await openAs(browser, "guest"); // guest001 (제3자)

    // host001 <-> guest002 대화에 비밀 메시지
    const convPath = await hostEnterDmWith(host.page, GUEST002_ID);
    const secret = `E2E 비밀 ${Date.now()}`;
    await send(host.page, secret);
    await expect(host.page.getByText(secret)).toBeVisible({ timeout: 10_000 });

    // 제3자(guest001)가 그 대화방 URL 직접 접근 -> 비밀 메시지가 보이면 안 된다
    await outsider.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await outsider.page.waitForTimeout(1500);
    await expect(outsider.page.getByText(secret)).toHaveCount(0);
    await expectNotCrashed(outsider.page);

    await host.context.close();
    await outsider.context.close();
  });

  test("메시지의 HTML/스크립트는 텍스트로 이스케이프되어 렌더된다 (XSS 방지)", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    const payload = `<img src=x onerror=alert(1)> E2E XSS ${Date.now()}`;
    await page.getByPlaceholder(MSG_INPUT).fill(payload);
    await page.getByLabel("전송").click();

    await expect(page.getByText(payload)).toBeVisible({ timeout: 10_000 });
    // 주입된 img가 실제 DOM 요소로 생성되지 않았다
    expect(await page.locator('img[src="x"]').count()).toBe(0);

    await context.close();
  });

  test("공백만 입력하면 전송 버튼이 비활성이다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    await page.getByPlaceholder(MSG_INPUT).fill("     ");
    await expect(page.getByLabel("전송")).toBeDisabled();
    await context.close();
  });

  test("정확히 2000자 메시지는 전송된다 (경계)", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const tag = `E2E2000-${Date.now()}-`;
    const msg = tag + "가".repeat(2000 - tag.length);
    expect(msg.length).toBe(2000);
    await page.getByPlaceholder(MSG_INPUT).fill(msg);
    await page.getByLabel("전송").click();
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test("이모지 메시지가 정상 표시된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 😀🎉🔥🥹👍 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test("공백 없는 긴 문자열도 말풍선이 화면 폭을 넘지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = "A".repeat(200) + Date.now();
    await send(page, msg);
    const bubble = page.getByText(msg);
    await expect(bubble).toBeVisible({ timeout: 10_000 });
    const box = await bubble.boundingBox();
    expect(box && box.width <= 460).toBeTruthy();
    await context.close();
  });

  test("같은 유저의 두 번째 탭에서도 보낸 메시지가 보인다 (멀티탭 동기화)", async ({ browser }) => {
    const tabA = await openAs(browser, "newHost");
    const tabB = await openAs(browser, "newHost"); // 같은 유저 host001

    const convPath = await hostEnterDmWithGuest(tabA.page);
    await tabB.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(tabB.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    const msg = `E2E 멀티탭 ${Date.now()}`;
    await send(tabA.page, msg);

    // 같은 유저의 다른 탭에도 새로고침 없이 반영되어야 한다
    await expect(tabB.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await tabA.context.close();
    await tabB.context.close();
  });

  test("오프라인 중 도착한 메시지가 재연결 후 유실되지 않는다", async ({ browser }) => {
    test.setTimeout(60_000);
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    // guest 오프라인 -> 그 사이 host가 전송 -> guest 재연결
    await guest.context.setOffline(true);
    const msg = `E2E 오프라인중 ${Date.now()}`;
    await send(host.page, msg);
    await host.page.waitForTimeout(1000);
    await guest.context.setOffline(false);

    // 1순위: 소켓 reconnect -> invalidate 자동 복구(새로고침 없이). 잠시 기다린다.
    const recovered = await guest.page
      .getByText(msg)
      .waitFor({ timeout: 12_000 })
      .then(() => true)
      .catch(() => false);

    // socket.io 끊김 감지(ping timeout)가 지연되면 자동 복구가 느릴 수 있다.
    // 그 경우라도 재진입(새로고침)으로 반드시 복구되어야 한다 = 메시지 유실 없음.
    if (!recovered) {
      await guest.page.reload({ waitUntil: "domcontentloaded" });
    }
    await expect(guest.page.getByText(msg)).toBeVisible({ timeout: 15_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("수정 직후 삭제해도 양쪽에서 삭제 상태로 일관된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");

    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });

    const orig = `E2E 수삭 ${Date.now()}`;
    await send(host.page, orig);
    await expect(guest.page.getByText(orig)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(orig));
    await host.page.getByRole("button", { name: "수정" }).click();
    const edited = `E2E 수삭편집 ${Date.now()}`;
    await host.page.getByPlaceholder("수정 메시지 입력").fill(edited);
    await host.page.getByLabel("수정 완료").click();
    await expect(host.page.getByText(edited)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(edited));
    await host.page.getByRole("button", { name: "삭제" }).click();
    await expect(host.page.getByText("이 메시지를 삭제하면 상대방 화면에서도 사라집니다.")).toBeVisible();
    await host.page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();

    await expect(host.page.getByText("삭제된 메시지입니다").first()).toBeVisible({ timeout: 10_000 });
    await expect(guest.page.getByText(/삭제된 메시지/).first()).toBeVisible({ timeout: 10_000 });
    await expect(host.page.getByText(edited)).toHaveCount(0);
    await expect(guest.page.getByText(edited)).toHaveCount(0);

    await host.context.close();
    await guest.context.close();
  });

  test("자기 자신 프로필 진입은 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await page.goto(`/friends/${HOST001_ID}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    // 만약 1:1 채팅 버튼이 있으면 눌러도 크래시하지 않아야 한다 (CANNOT_MESSAGE_SELF)
    const chatBtn = page.getByRole("button", { name: "1:1 채팅" });
    if (await chatBtn.count()) {
      await chatBtn.click();
      await page.waitForTimeout(1000);
      await expectNotCrashed(page);
    }
    await context.close();
  });
});

test.describe("dm-batch5-resilience", () => {
  test("메시지 목록 API가 실패해도 채팅방이 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await mockApiRouteFailure(page, /\/api\/conversations\/[^/]+\/messages(\?.*)?$/, {
      method: "GET",
      status: 500,
    });
    await hostEnterDmWithGuest(page);
    await page.waitForTimeout(1200);
    await expectNotCrashed(page);
    await context.close();
  });

  test("대화 목록 API가 실패해도 채팅 탭이 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await mockApiRouteFailure(page, /\/api\/conversations(\?.*)?$/, {
      method: "GET",
      status: 500,
    });
    await page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expectNotCrashed(page);
    await context.close();
  });

  test("안읽음 카운트 API가 실패해도 친구 탭이 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await mockApiRouteFailure(page, /\/api\/conversations\/unread-count/, {
      method: "GET",
      status: 500,
    });
    await page.goto("/friends", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    await context.close();
  });

  test("수정 API 실패 시 토스트가 뜨고 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 수정실패 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await mockApiRouteFailure(page, /\/api\/conversations\/[^/]+\/messages\/[^/]+/, {
      method: "PATCH",
      status: 500,
    });
    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "수정" }).click();
    await page.getByPlaceholder("수정 메시지 입력").fill(`${msg} 편집`);
    await page.getByLabel("수정 완료").click();

    await expect(page.getByText(/수정하지 못했어요/)).toBeVisible({ timeout: 10_000 });
    await expectNotCrashed(page);
    await context.close();
  });

  test("삭제 API 실패 시 크래시하지 않는다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 삭제실패 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await mockApiRouteFailure(page, /\/api\/conversations\/[^/]+\/messages\/[^/]+/, {
      method: "DELETE",
      status: 500,
    });
    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "삭제" }).click();
    await expect(page.getByText("이 메시지를 삭제하면 상대방 화면에서도 사라집니다.")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
    await page.waitForTimeout(1000);
    await expectNotCrashed(page);
    await context.close();
  });

  test("메시지를 길게 눌러 복사하면 '복사했어요' 토스트가 뜬다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 복사 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "복사" }).click();
    await expect(page.getByText("복사했어요")).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test("이전 메시지 페이지네이션이 동작한다 (누적 대화)", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    await page.waitForTimeout(800);

    const moreBtn = page.getByRole("button", { name: "이전 메시지 보기" });
    // 누적 메시지가 한 페이지를 넘으면 버튼이 보인다. 있으면 클릭해 과거 로드.
    if (await moreBtn.count()) {
      await moreBtn.first().click();
      await page.waitForTimeout(1000);
      await expectNotCrashed(page);
    }
    await expect(page.getByPlaceholder(MSG_INPUT)).toBeVisible();
    await context.close();
  });
});

test.describe("dm-batch6-reactions", () => {
  test("이모지 리액션을 달면 말풍선에 배지가 뜨고, 다시 누르면 취소된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 리액션 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    const row = page.locator("li").filter({ hasText: msg });

    // 길게눌러 메뉴 -> heart 리액션
    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "heart 리액션" }).click();
    await expect(row.getByText("❤️")).toBeVisible({ timeout: 10_000 });

    // 다시 heart -> 취소(배지 사라짐)
    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "heart 리액션" }).click();
    await expect(row.getByText("❤️")).toHaveCount(0, { timeout: 10_000 });

    await context.close();
  });

  test("리액션이 상대 화면에 실시간 반영된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");
    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    const msg = `E2E 리액션실시간 ${Date.now()}`;
    await send(host.page, msg);
    await expect(guest.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    await longPress(host.page, host.page.getByText(msg));
    await host.page.getByRole("button", { name: "thumbsup 리액션" }).click();

    const guestRow = guest.page.locator("li").filter({ hasText: msg });
    await expect(guestRow.getByText("👍")).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("리액션 배지를 길게 누르면 누가 눌렀는지 상세 시트가 뜬다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);
    const msg = `E2E 리액션상세 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });
    const row = page.locator("li").filter({ hasText: msg });

    await longPress(page, page.getByText(msg));
    await page.getByRole("button", { name: "heart 리액션" }).click();
    const badge = row.locator("button", { hasText: "❤️" });
    await expect(badge).toBeVisible({ timeout: 10_000 });

    // 배지를 꾸욱 -> 리액션 상세 시트(제목 + 이모지)
    await longPress(page, badge);
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("리액션", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByText("❤️").first()).toBeVisible();

    await context.close();
  });

  test("상세 시트가 열린 채 상대가 리액션을 취소하면 목록에서 즉시 사라진다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");
    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    const msg = `E2E 리액션라이브 ${Date.now()}`;
    await send(host.page, msg);
    await expect(guest.page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    // 둘 다 heart -> host 화면 배지 ❤️ 2
    await longPress(host.page, host.page.getByText(msg));
    await host.page.getByRole("button", { name: "heart 리액션" }).click();
    await longPress(guest.page, guest.page.getByText(msg));
    await guest.page.getByRole("button", { name: "heart 리액션" }).click();

    const hostRow = host.page.locator("li").filter({ hasText: msg });
    const heartBadge = hostRow.locator("button", { hasText: "❤️" });
    await expect(heartBadge.getByText("2")).toBeVisible({ timeout: 10_000 });

    // host가 상세 시트 오픈 -> 리액터 2명
    await longPress(host.page, heartBadge);
    const sheet = host.page.getByRole("dialog");
    await expect(sheet.locator("ul li")).toHaveCount(2, { timeout: 10_000 });

    // guest가 취소 -> host의 열린 시트 목록이 1명으로 즉시 갱신
    await longPress(guest.page, guest.page.getByText(msg));
    await guest.page.getByRole("button", { name: "heart 리액션" }).click();
    await expect(sheet.locator("ul li")).toHaveCount(1, { timeout: 10_000 });

    await host.context.close();
    await guest.context.close();
  });
});

// 1x1 PNG (S3 mock 응답 + 업로드 파일용)
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

test.describe("dm-batch7-image", () => {
  test("사진을 보내면 이미지 메시지가 말풍선에 표시된다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    // dev 더미 S3 버킷의 PUT(업로드)/GET(조회)을 mock
    await page.route(/dev-dummy-bucket\.s3\.[^/]+\.amazonaws\.com/, (route) => {
      if (route.request().method() === "PUT") return route.fulfill({ status: 200 });
      return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1x1 });
    });

    await hostEnterDmWithGuest(page);
    await page.setInputFiles('input[type="file"]', {
      name: "e2e.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });
    // 미리보기 모달에서 전송 확인
    await page.getByRole("button", { name: "보내기", exact: true }).click();

    await expect(page.locator('img[alt="사진"]').last()).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("이미지 메시지가 상대 화면에 실시간 표시된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const guest = await openAs(browser, "guest");
    for (const p of [host.page, guest.page]) {
      await p.route(/dev-dummy-bucket\.s3\.[^/]+\.amazonaws\.com/, (route) => {
        if (route.request().method() === "PUT") return route.fulfill({ status: 200 });
        return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1x1 });
      });
    }
    const convPath = await hostEnterDmWithGuest(host.page);
    await guest.page.goto(convPath, { waitUntil: "domcontentloaded" });
    await expect(guest.page.getByPlaceholder(MSG_INPUT)).toBeVisible();

    await host.page.setInputFiles('input[type="file"]', {
      name: "e2e.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });
    // 미리보기 모달에서 전송 확인
    await host.page.getByRole("button", { name: "보내기", exact: true }).click();

    await expect(guest.page.locator('img[alt="사진"]').last()).toBeVisible({ timeout: 15_000 });
    await host.context.close();
    await guest.context.close();
  });
});

test.describe("dm-batch8-drawer", () => {
  test("대화방 서랍에 대화상대 목록과 보낸 사진 갤러리가 보인다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    // 사진 1장 전송 -> 갤러리에 떠야 함
    await page.setInputFiles('input[type="file"]', {
      name: "gallery.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });
    await page.getByRole("button", { name: "보내기", exact: true }).click();
    await expect(page.locator('img[alt="사진"]').last()).toBeVisible({ timeout: 15_000 });

    // 우측 상단 메뉴 -> 서랍 열기
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/대화상대/)).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByRole("button", { name: /초대하기/ })).toBeVisible();
    // 갤러리에 보낸 사진
    await expect(drawer.locator('img[alt="사진"]').first()).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test("사진 메시지를 누르면 크게 보기가 열리고 저장 버튼이 있다", async ({ browser }) => {
    const { context, page } = await openAs(browser, "newHost");
    await hostEnterDmWithGuest(page);

    await page.setInputFiles('input[type="file"]', {
      name: "viewer.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });
    await page.getByRole("button", { name: "보내기", exact: true }).click();
    const sent = page.locator('img[alt="사진"]').last();
    await expect(sent).toBeVisible({ timeout: 15_000 });

    // 사진 탭 -> 크게 보기 + 저장 버튼
    await sent.click();
    await expect(
      page.getByRole("img", { name: "사진 크게 보기" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "사진 저장" })).toBeVisible();

    await context.close();
  });

  test("갤러리 사진은 좌우로 넘겨볼 수 있고 업로더·시간이 표시된다", async ({
    browser,
  }) => {
    const { context, page } = await openAs(browser, "newHost");
    // 누적 없는 빈 그룹방을 만들어 사진을 올린다 (누적 DM은 느려 타임아웃)
    const dmPath = await hostEnterDmWith(page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    await page.getByRole("button", { name: "초대하기" }).click();
    const inviteSheet = page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await inviteSheet.getByText(GUEST002_NAME, { exact: true }).click();
    await inviteSheet.getByRole("button", { name: /초대/ }).click();
    await page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });
    await expect(page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });

    // 빈 그룹에 사진 2장
    for (const n of ["a", "b"]) {
      await page.setInputFiles('input[type="file"]', {
        name: `slide-${n}.png`,
        mimeType: "image/png",
        buffer: PNG_1x1,
      });
      await page.getByRole("button", { name: "보내기", exact: true }).click();
      await expect(page.locator('img[alt="사진"]').last()).toBeVisible({ timeout: 15_000 });
    }

    // 서랍 갤러리 첫 사진 클릭 -> 뷰어 (vaul 드로어 애니메이션 회피로 force)
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    const drawer = page.getByRole("dialog");
    const thumbs = drawer.locator('button:has(img[alt="사진"])');
    await expect(thumbs.first()).toBeVisible({ timeout: 10_000 });
    // vaul 우측 드로어 애니메이션/위치 무관하게 onClick만 발화
    await thumbs.first().dispatchEvent("click");

    // 뷰어: 업로더 시간(년) 표시 + 1/N -> 다음 -> 2/N
    await expect(page.getByRole("img", { name: "사진 크게 보기" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\d{4}년/)).toBeVisible();
    await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();
    await page.getByRole("button", { name: "다음 사진" }).click();
    await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible();

    await context.close();
  });
});

test.describe("dm-batch9-group", () => {
  test("1:1에서 친구를 초대하면 새 단톡방이 만들어지고 메시지를 보낼 수 있다", async ({
    browser,
  }) => {
    const { context, page } = await openAs(browser, "newHost");
    const dmPath = await hostEnterDmWithGuest(page); // guest001과 1:1
    const dmId = dmPath.split("/").pop()!;

    // 서랍 -> 초대하기 -> 친구 검색 -> 선택 -> 초대
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    await page.getByRole("button", { name: "초대하기" }).click();
    const sheet = page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByPlaceholder("이름으로 친구 검색").fill(GUEST002_NAME);
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();

    // 새 단톡방으로 이동 + 입장 시스템 메시지
    await page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });
    await expect(page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(`${GUEST002_NAME}님이 들어왔습니다.`),
    ).toBeVisible({ timeout: 10_000 });
    const msg = `E2E 단톡 ${Date.now()}`;
    await send(page, msg);
    await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

    // 서랍 열어 대화상대 3명 확인 (나 + 상대 + 초대 1명)
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    await expect(page.getByText("대화상대 3")).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test("생성 시 방 이름을 정하고, 내 별명으로 바꾸면 내 화면만 바뀐다", async ({
    browser,
  }) => {
    const { context, page } = await openAs(browser, "newHost");
    const dmPath = await hostEnterDmWith(page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;

    // 초대 + 공유 방 이름 설정
    await page.getByRole("button", { name: "대화방 메뉴" }).click();
    await page.getByRole("button", { name: "초대하기" }).click();
    const sheet = page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByPlaceholder("단톡방 이름 (선택)").fill("E2E모임");
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();
    await page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });

    // 헤더에 공유 이름
    await expect(page.getByRole("button", { name: /E2E모임/ })).toBeVisible({ timeout: 10_000 });

    // 헤더(그룹명) 탭 -> 서랍 -> 이름 변경(내 별명)
    await page.getByRole("button", { name: /E2E모임/ }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("채팅방 이름")).toBeVisible({ timeout: 10_000 });
    await drawer.getByRole("button", { name: "변경" }).click();
    const aliasSheet = page.getByRole("dialog").filter({ hasText: "채팅방 이름 변경" });
    await aliasSheet.getByPlaceholder("나만 보이는 방 이름").fill("내방별명");
    await aliasSheet.getByRole("button", { name: "저장" }).click();

    // 내 별명이 반영됨 (드로어 방 이름) + 드로어 닫으면 헤더도 별명으로
    await expect(drawer.getByText("내방별명")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /내방별명/ })).toBeVisible({ timeout: 10_000 });

    await context.close();
  });
});

test.describe("dm-batch10-group-realtime", () => {
  test("3계정 단톡방: 실시간 메시지가 세 명 모두에게 전달된다", async ({
    browser,
  }) => {
    const host = await openAs(browser, "newHost"); // host001
    const g1 = await openAs(browser, "guest"); // guest001
    const g2 = await openAs(browser, "guest2"); // guest002

    // host: guest001과 1:1 -> guest002 초대 -> 새 단톡방(3명)
    const dmPath = await hostEnterDmWith(host.page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;
    await host.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await host.page.getByRole("button", { name: "초대하기" }).click();
    const sheet = host.page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();
    await host.page.waitForURL((url) => !url.pathname.includes(dmId), {
      timeout: 10_000,
    });
    const groupPath = new URL(host.page.url()).pathname;

    // 나머지 두 명이 같은 방에 진입
    await g1.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await g2.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await expect(g1.page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });
    await expect(g2.page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });
    // 게스트 소켓이 user 룸에 join할 여유 (join 전 emit은 socket.io가 놓침)
    await g1.page.waitForTimeout(2500);

    // host 전송 -> g1, g2 실시간 수신
    const msgA = `E2E 그룹A ${Date.now()}`;
    await send(host.page, msgA);
    await expect(g1.page.getByText(msgA)).toBeVisible({ timeout: 15_000 });
    await expect(g2.page.getByText(msgA)).toBeVisible({ timeout: 15_000 });

    // g1 전송 -> host, g2 실시간 수신
    const msgB = `E2E 그룹B ${Date.now()}`;
    await send(g1.page, msgB);
    await expect(host.page.getByText(msgB)).toBeVisible({ timeout: 10_000 });
    await expect(g2.page.getByText(msgB)).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await g1.context.close();
    await g2.context.close();
  });
});

test.describe("dm-batch11-leave", () => {
  test("그룹에서 나가면 남은 멤버에게 시스템 메시지가 뜨고 인원이 줄어든다", async ({
    browser,
  }) => {
    const host = await openAs(browser, "newHost"); // host001
    const g2 = await openAs(browser, "guest2"); // guest002(송지안)

    // host: guest001과 1:1 -> guest002 초대 -> 그룹(3명)
    const dmPath = await hostEnterDmWith(host.page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;
    await host.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await host.page.getByRole("button", { name: "초대하기" }).click();
    const sheet = host.page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();
    await host.page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });
    const groupPath = new URL(host.page.url()).pathname;

    // g2가 그룹 진입 후 나가기
    await g2.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await expect(g2.page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });
    await g2.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await expect(g2.page.getByText(/대화상대/)).toBeVisible({ timeout: 10_000 });
    await g2.page.getByRole("button", { name: "채팅방 나가기" }).click();
    const leaveModal = g2.page.getByRole("dialog").filter({ hasText: "나가면" });
    await leaveModal.getByRole("button", { name: "나가기" }).click();

    // host: 시스템 메시지(실시간) + 대화상대 2명으로 감소
    await expect(
      host.page.getByText(`${GUEST002_NAME}님이 나갔습니다.`),
    ).toBeVisible({ timeout: 10_000 });
    await host.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await expect(host.page.getByText("대화상대 2")).toBeVisible({ timeout: 10_000 });

    await host.context.close();
    await g2.context.close();
  });
});

test.describe("dm-batch12-unread-count", () => {
  test("그룹 메시지 안읽음 수가 멤버가 읽을 때마다 줄어든다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const g1 = await openAs(browser, "guest");
    const g2 = await openAs(browser, "guest2");

    // 그룹 생성 (host + guest001 + guest002 = 3명)
    const dmPath = await hostEnterDmWith(host.page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;
    await host.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await host.page.getByRole("button", { name: "초대하기" }).click();
    const sheet = host.page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();
    await host.page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });
    const groupPath = new URL(host.page.url()).pathname;

    // g1, g2는 방 밖(채팅 목록)에 머문다 (아직 안 읽음)
    await g1.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });
    await g2.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });

    // host 전송 -> 안읽음 2
    const msg = `E2E 안읽음수 ${Date.now()}`;
    await send(host.page, msg);
    const row = host.page.locator("li").filter({ hasText: msg });
    await expect(row.locator("span.text-primary")).toHaveText("2", { timeout: 10_000 });

    // g1 입장(읽음) -> 1
    await g1.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await expect(row.locator("span.text-primary")).toHaveText("1", { timeout: 12_000 });

    // g2 입장(읽음) -> 0 (숫자 사라짐)
    await g2.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await expect(row.locator("span.text-primary")).toHaveCount(0, { timeout: 12_000 });

    await host.context.close();
    await g1.context.close();
    await g2.context.close();
  });

  test("그룹에서는 상대 메시지에도 안읽음 수가 표시된다", async ({ browser }) => {
    const host = await openAs(browser, "newHost");
    const g1 = await openAs(browser, "guest");
    const g2 = await openAs(browser, "guest2");

    const dmPath = await hostEnterDmWith(host.page, GUEST001_ID);
    const dmId = dmPath.split("/").pop()!;
    await host.page.getByRole("button", { name: "대화방 메뉴" }).click();
    await host.page.getByRole("button", { name: "초대하기" }).click();
    const sheet = host.page.getByRole("dialog").filter({ hasText: "초대할 친구" });
    await sheet.getByText(GUEST002_NAME, { exact: true }).click();
    await sheet.getByRole("button", { name: /초대/ }).click();
    await host.page.waitForURL((url) => !url.pathname.includes(dmId), { timeout: 10_000 });
    const groupPath = new URL(host.page.url()).pathname;

    // g1은 방 입장, g2는 방 밖(안 읽음 유지)
    await g1.page.goto(groupPath, { waitUntil: "domcontentloaded" });
    await expect(g1.page.getByPlaceholder(MSG_INPUT)).toBeVisible({ timeout: 10_000 });
    await g2.page.goto("/friends?tab=chat", { waitUntil: "domcontentloaded" });
    await g1.page.waitForTimeout(2500); // 소켓 연결

    // g1이 전송 -> host(상대)가 g1 메시지에 안읽음 수를 본다 (g2 미독)
    const msg = `E2E 상대안읽음 ${Date.now()}`;
    await send(g1.page, msg);
    const row = host.page.locator("li").filter({ hasText: msg });
    await expect(row).toBeVisible({ timeout: 12_000 });
    await expect(row.locator("span.text-primary")).toBeVisible({ timeout: 12_000 });

    await host.context.close();
    await g1.context.close();
    await g2.context.close();
  });
});
