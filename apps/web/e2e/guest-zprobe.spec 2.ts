import { test } from "./fixtures";
import { findGuestInvitation } from "./helpers";

test("probe browser comment POST", async ({ page }) => {
  const inv = await findGuestInvitation(page);
  console.log("PROBE INV:", inv?.id, inv?.title);
  if (!inv) return;

  const responses: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/feedbacks") && res.request().method() === "POST") {
      responses.push(`POST ${res.status()} ${res.url().split("/api")[1] ?? res.url()}`);
    }
  });

  await page.goto(`/invitations/${inv.id}/comments`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const text = `PROBE ${Date.now()}`;
  await page.getByPlaceholder("댓글 남기기").fill(text);
  await page.getByLabel("댓글 등록").click();
  await page.waitForTimeout(3000);
  console.log("PROBE POST responses:", JSON.stringify(responses));
  // check origin/referer the browser would send
  const origin = await page.evaluate(() => window.location.origin);
  console.log("PROBE page origin:", origin);
});
