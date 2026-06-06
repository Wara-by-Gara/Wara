import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import { PERSONAS, API_BASE_URL, authFile } from "./personas";

// 웹에는 dev 로그인 UI가 없으므로, API dev 토큰 엔드포인트로 페르소나별 토큰을 받아
// accessToken(httpOnly) + is_logged_in(평문) 쿠키를 storageState로 저장한다.
setup("authenticate all personas", async ({ playwright }) => {
  const ctx = await playwright.request.newContext();
  fs.mkdirSync("e2e/.auth", { recursive: true });

  for (const persona of PERSONAS) {
    const res = await ctx.post(`${API_BASE_URL}/api/auth/dev/token`, {
      data: { email: persona.email },
    });
    expect(res.ok(), `dev token 발급 실패: ${persona.email} (${res.status()})`).toBeTruthy();

    const body = (await res.json()) as { data: { accessToken: string } };
    const token = body.data.accessToken;
    expect(token, `accessToken 누락: ${persona.email}`).toBeTruthy();

    const storageState = {
      cookies: [
        {
          name: "accessToken",
          value: token,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Lax" as const,
          expires: -1,
        },
        {
          name: "is_logged_in",
          value: "1",
          domain: "localhost",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "Lax" as const,
          expires: -1,
        },
      ],
      origins: [],
    };

    fs.writeFileSync(authFile(persona.key), JSON.stringify(storageState, null, 2));
  }

  await ctx.dispose();
});
