import { test, expectNoPageErrors } from "./fixtures";
import { smokeVisit } from "./helpers";

// 관리자 페르소나: 대시보드/문의/FAQ 관리.
test.describe("admin", () => {
  test("관리자 화면 스모크(대시보드/문의/FAQ)", async ({ page, pageErrors }) => {
    for (const path of ["/admin", "/admin/inquiries", "/admin/faq"]) {
      await smokeVisit(page, pageErrors, path);
    }
    expectNoPageErrors(pageErrors);
  });

  test("문의 작성/내 문의 화면 스모크", async ({ page, pageErrors }) => {
    for (const path of ["/inquiries", "/inquiries/write", "/inquiries/me"]) {
      await smokeVisit(page, pageErrors, path);
    }
    expectNoPageErrors(pageErrors);
  });
});
