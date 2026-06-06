import { test as base, expect, type Page } from "@playwright/test";

export interface WaraFixtures {
  // 페이지에서 발생한 uncaught 예외 (실제 크래시 신호)
  pageErrors: Error[];
  // console.error 로그 (필터링 후 보고용)
  consoleErrors: string[];
}

export const test = base.extend<WaraFixtures>({
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await use(errors);
  },
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await use(errors);
  },
});

export { expect };

// 네트워크/리소스 잡음 등 기능 버그가 아닌 콘솔 에러는 제외한다.
const BENIGN_CONSOLE_PATTERNS: RegExp[] = [
  /Failed to load resource/i,
  /favicon/i,
  /the server responded with a status of 401/i,
  /the server responded with a status of 403/i,
  /the server responded with a status of 404/i,
  /ERR_INTERNET_DISCONNECTED/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /websocket/i,
];

export function meaningfulConsoleErrors(errors: string[]): string[] {
  return errors.filter((e) => !BENIGN_CONSOLE_PATTERNS.some((p) => p.test(e)));
}

// uncaught 예외(=실제 크래시)는 항상 0건이어야 한다.
export function expectNoPageErrors(pageErrors: Error[]): void {
  expect(
    pageErrors.map((e) => e.message),
    "페이지에서 uncaught 예외 발생",
  ).toEqual([]);
}

// 페이지가 Next.js global-error 화면으로 떨어지지 않았는지 확인.
export async function expectNotCrashed(page: Page): Promise<void> {
  // 클라이언트 리다이렉트(/login 등) 진행 중 assertion이 깨지지 않도록 안착 후 검사.
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("load").catch(() => {});
  const crashCopy = page.getByText(
    /Application error|문제가 발생|오류가 발생했어요|Something went wrong/i,
  );
  await expect(crashCopy).toHaveCount(0);
}
