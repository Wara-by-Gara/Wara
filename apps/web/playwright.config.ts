import { defineConfig, devices } from "@playwright/test";
import { WEB_BASE_URL, authFile } from "./e2e/personas";

// 서버(웹 :3000, API :3001, Postgres)는 외부에서 미리 기동되어 있어야 한다.
// 페르소나별 storageState는 setup 프로젝트(auth.setup.ts)가 생성한다.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // dev 서버(Next/Nest watch)는 장시간 실행 시 재시작·일시 불가 구간이 생길 수 있어,
  // 일시적 네트워크 블립을 진짜 실패와 구분하기 위해 1회 재시도한다.
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: WEB_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "newHost",
      testMatch: /newHost.*\.spec\.ts|host-edit\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("newHost") },
    },
    {
      name: "hostOperator",
      testMatch: /hostOperator.*\.spec\.ts|host-edit\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("hostOperator") },
    },
    {
      name: "guest",
      testMatch: /guest.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("guest") },
    },
    {
      name: "admin",
      testMatch: /admin.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("admin") },
    },
    {
      name: "voteFlow",
      testMatch: /date-vote-flow\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("guest") },
    },
    {
      name: "locationFlow",
      testMatch: /location-flow\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("newHost") },
    },
    {
      // 트랙 A 위치 공유 회귀 방지 — REST·WS 모두 request fixture + devToken 직접 사용하므로
      // 페르소나 storageState 불필요. anon과 동일하게 setup 의존성 없이 단독 실행.
      name: "locationApi",
      testMatch: /location-(privacy|realtime|auth)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "dmFlow",
      testMatch: /dm-flow\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile("newHost") },
    },
    {
      name: "anon",
      testMatch: /anon.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
