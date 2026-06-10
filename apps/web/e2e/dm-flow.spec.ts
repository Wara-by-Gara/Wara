import { test, expect } from "./fixtures";
import { authFile } from "./personas";
import {
  DM_USER_A,
  DM_USER_B,
  DM_USER_C,
  FAKE_ULID,
  createConversation,
  deleteMessage,
  devToken,
  editMessage,
  getConversation,
  getConversations,
  getMe,
  getMessages,
  getUnreadCount,
  leaveConversation,
  markRead,
  sendMessage,
  setupDmPair,
  uniqueDmText,
} from "./dm-flow-api";
import {
  getFriends,
  gotoChatRoom,
  longPress,
  openChatTab,
} from "./helpers";

test.describe("DM · API (01–20)", () => {
  test("01 · POST /conversations 두 번 호출 시 동일 id (directKey 멱등)", async ({
    request,
  }) => {
    const tokenA = await devToken(request, DM_USER_A);
    const meB = await getMe(request, await devToken(request, DM_USER_B));
    expect(meB.data?.id).toBeTruthy();

    const first = await createConversation(request, tokenA, meB.data!.id);
    const second = await createConversation(request, tokenA, meB.data!.id);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.data!.id).toBe(second.data!.id);
  });

  test("02 · targetUserId가 본인이면 400 CANNOT_MESSAGE_SELF", async ({ request }) => {
    const tokenA = await devToken(request, DM_USER_A);
    const meA = await getMe(request, tokenA);
    const res = await createConversation(request, tokenA, meA.data!.id);
    expect(res.status).toBe(400);
    expect(res.errorCode).toBe("CANNOT_MESSAGE_SELF");
  });

  test("03 · 존재하지 않는 userId면 404 USER_NOT_FOUND", async ({ request }) => {
    const tokenA = await devToken(request, DM_USER_A);
    const res = await createConversation(request, tokenA, FAKE_ULID);
    expect(res.status).toBe(404);
    expect(res.errorCode).toBe("USER_NOT_FOUND");
  });

  test("04 · 비멤버 C가 GET /conversations/:id → 403 CONVERSATION_FORBIDDEN", async ({
    request,
  }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const tokenC = await devToken(request, DM_USER_C);
    const res = await getConversation(request, tokenC, pair.conversationId);
    expect(res.status).toBe(403);
    expect(res.errorCode).toBe("CONVERSATION_FORBIDDEN");
  });

  test("05 · 잘못된 conversationId면 404 CONVERSATION_NOT_FOUND", async ({ request }) => {
    const tokenA = await devToken(request, DM_USER_A);
    const res = await getConversation(request, tokenA, FAKE_ULID);
    expect(res.status).toBe(404);
    expect(res.errorCode).toBe("CONVERSATION_NOT_FOUND");
  });

  test("06 · A-B, A-C 각각 생성 시 서로 다른 id", async ({ request }) => {
    const tokenA = await devToken(request, DM_USER_A);
    const meB = await getMe(request, await devToken(request, DM_USER_B));
    const meC = await getMe(request, await devToken(request, DM_USER_C));
    const ab = await createConversation(request, tokenA, meB.data!.id);
    const ac = await createConversation(request, tokenA, meC.data!.id);
    expect(ab.data!.id).not.toBe(ac.data!.id);
  });

  test("07 · 메시지 전송 201, content 일치", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("E2E send");
    const sent = await sendMessage(request, pair.tokenA, pair.conversationId, text);
    expect(sent.status).toBe(201);
    expect(sent.data!.content).toBe(text);
  });

  test("08 · 빈 문자열 / 공백만 → 400 VALIDATION_ERROR", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    for (const content of ["", "   "]) {
      const res = await sendMessage(request, pair.tokenA, pair.conversationId, content);
      expect(res.status).toBe(400);
      expect(res.errorCode).toBe("VALIDATION_ERROR");
    }
  });

  test("09 · 2000자 초과 → 400 VALIDATION_ERROR", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const res = await sendMessage(request, pair.tokenA, pair.conversationId, "x".repeat(2001));
    expect(res.status).toBe(400);
    expect(res.errorCode).toBe("VALIDATION_ERROR");
  });

  test("10 · replyToMessageId 답장 시 replyTo preview 포함", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const original = uniqueDmText("E2E reply target");
    const parent = await sendMessage(request, pair.tokenA, pair.conversationId, original);
    const replyText = uniqueDmText("E2E reply");
    const reply = await sendMessage(
      request,
      pair.tokenB,
      pair.conversationId,
      replyText,
      parent.data!.id,
    );
    expect(reply.status).toBe(201);
    expect(reply.data!.replyTo?.id).toBe(parent.data!.id);
    expect(reply.data!.replyTo?.content).toBe(original);
  });

  test("10b · 다른 방 replyToMessageId → 404 MESSAGE_NOT_FOUND", async ({ request }) => {
    const pairAB = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const pairAC = await setupDmPair(request, DM_USER_A, DM_USER_C);
    const parent = await sendMessage(
      request,
      pairAB.tokenA,
      pairAB.conversationId,
      uniqueDmText("other-room"),
    );
    const res = await sendMessage(
      request,
      pairAC.tokenA,
      pairAC.conversationId,
      uniqueDmText("bad-reply"),
      parent.data!.id,
    );
    expect(res.status).toBe(404);
    expect(res.errorCode).toBe("MESSAGE_NOT_FOUND");
  });

  test("11 · cursor 페이지네이션 limit=2", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const texts = ["m1", "m2", "m3"].map((p) => uniqueDmText(p));
    for (const t of texts) {
      await sendMessage(request, pair.tokenA, pair.conversationId, t);
    }
    const page1 = await getMessages(request, pair.tokenA, pair.conversationId, { limit: 2 });
    expect(page1.data!.messages).toHaveLength(2);
    expect(page1.data!.nextCursor).toBeTruthy();
    const page2 = await getMessages(request, pair.tokenA, pair.conversationId, {
      limit: 2,
      cursor: page1.data!.nextCursor!,
    });
    expect(page2.data!.messages.length).toBeGreaterThanOrEqual(1);
    const allIds = [...page1.data!.messages, ...page2.data!.messages].map((m) => m.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  test("12 · 본인 메시지 PATCH → edited true", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const sent = await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("edit"));
    const updated = uniqueDmText("edited");
    const res = await editMessage(
      request,
      pair.tokenA,
      pair.conversationId,
      sent.data!.id,
      updated,
    );
    expect(res.status).toBe(200);
    expect(res.data!.edited).toBe(true);
    expect(res.data!.content).toBe(updated);
  });

  test("13 · 타인 메시지 PATCH → 403 MESSAGE_FORBIDDEN", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const sent = await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("forbid"));
    const res = await editMessage(
      request,
      pair.tokenB,
      pair.conversationId,
      sent.data!.id,
      "hack",
    );
    expect(res.status).toBe(403);
    expect(res.errorCode).toBe("MESSAGE_FORBIDDEN");
  });

  test("14 · 본인 메시지 DELETE → deleted true, content 빈값", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const sent = await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("del"));
    const del = await deleteMessage(request, pair.tokenA, pair.conversationId, sent.data!.id);
    expect(del.status).toBe(204);
    const list = await getMessages(request, pair.tokenA, pair.conversationId);
    const found = list.data!.messages.find((m) => m.id === sent.data!.id);
    expect(found?.deleted).toBe(true);
    expect(found?.content).toBe("");
  });

  test("15 · A 3통 전송 후 B unread-count ≥ 3", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    for (let i = 0; i < 3; i++) {
      await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText(`unread-${i}`));
    }
    const unread = await getUnreadCount(request, pair.tokenB);
    expect(unread.data!.count).toBeGreaterThanOrEqual(3);
  });

  test("16 · B read 후 unread-count 0", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("read"));
    const read = await markRead(request, pair.tokenB, pair.conversationId);
    expect(read.status).toBe(204);
    const unread = await getUnreadCount(request, pair.tokenB);
    expect(unread.data!.count).toBe(0);
  });

  test("17 · read 후 A GET conversation → partnerLastReadAt 갱신", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("read-at"));
    await markRead(request, pair.tokenB, pair.conversationId);
    const detail = await getConversation(request, pair.tokenA, pair.conversationId);
    expect(detail.data!.partnerLastReadAt).toBeTruthy();
  });

  test("18 · B 나가기 후 B 목록에서 제거", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B, {
      seedMessage: uniqueDmText("leave"),
    });
    const left = await leaveConversation(request, pair.tokenB, pair.conversationId);
    expect(left.status).toBe(204);
    const list = await getConversations(request, pair.tokenB);
    expect(list.data!.some((c) => c.id === pair.conversationId)).toBe(false);
  });

  test("19 · 나간 뒤 A 재전송 → B 목록 재등장, leftAt 이전 메시지 미노출", async ({
    request,
  }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const oldMsg = uniqueDmText("before-leave");
    await sendMessage(request, pair.tokenA, pair.conversationId, oldMsg);
    await leaveConversation(request, pair.tokenB, pair.conversationId);
    const afterLeave = uniqueDmText("after-leave");
    await sendMessage(request, pair.tokenA, pair.conversationId, afterLeave);
    const list = await getConversations(request, pair.tokenB);
    expect(list.data!.some((c) => c.id === pair.conversationId)).toBe(true);
    const msgs = await getMessages(request, pair.tokenB, pair.conversationId);
    const contents = msgs.data!.messages.map((m) => m.content);
    expect(contents).toContain(afterLeave);
    expect(contents).not.toContain(oldMsg);
  });

  test("20 · 삭제된 메시지에 reply → preview deleted true", async ({ request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const parent = await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("del-reply"));
    await deleteMessage(request, pair.tokenA, pair.conversationId, parent.data!.id);
    const reply = await sendMessage(
      request,
      pair.tokenB,
      pair.conversationId,
      uniqueDmText("reply-deleted"),
      parent.data!.id,
    );
    expect(reply.data!.replyTo?.deleted).toBe(true);
  });
});

test.describe("DM · UI·실시간 (21–30)", () => {
  test("21 · 친구 프로필 → 1:1 채팅 → 입력창 visible", async ({ page, request }) => {
    const friends = await getFriends(page);
    const tokenB = await devToken(request, DM_USER_B);
    const meB = await getMe(request, tokenB);
    const target = friends.find((f) => f.id === meB.data?.id) ?? friends[0];
    expect(target).toBeTruthy();

    await page.goto(`/friends/${target!.id}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "1:1 채팅" }).click();
    await page.waitForURL(/\/chats\//, { timeout: 15_000 });
    await expect(page.getByPlaceholder("메시지를 입력하세요")).toBeVisible();
  });

  test("22 · UI에서 메시지 전송 → 본인 말풍선 표시", async ({ page, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("UI send");
    await gotoChatRoom(page, pair.conversationId);
    await page.getByPlaceholder("메시지를 입력하세요").fill(text);
    await page.getByRole("button", { name: "전송" }).click();
    await expect(page.getByText(text, { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("23 · 실시간 A 전송 → B 방에서 즉시 표시", async ({ browser, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("realtime");

    const ctxB = await browser.newContext({ storageState: authFile("guest") });
    const pageB = await ctxB.newPage();
    await gotoChatRoom(pageB, pair.conversationId);

    await sendMessage(request, pair.tokenA, pair.conversationId, text);
    await expect(pageB.getByText(text, { exact: true })).toBeVisible({ timeout: 15_000 });
    await ctxB.close();
  });

  test("24 · /friends?tab=chat lastMessage·파트너명 표시", async ({ page, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("list-preview");
    await sendMessage(request, pair.tokenA, pair.conversationId, text);
    await openChatTab(page);
    const name = pair.partnerNameB ?? "게스트";
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(text, { exact: false })).toBeVisible();
  });

  test("25 · B 미입장 시 A 전송 → B 채팅 탭 unread 배지", async ({ browser, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    await sendMessage(request, pair.tokenA, pair.conversationId, uniqueDmText("badge"));

    const ctxB = await browser.newContext({ storageState: authFile("guest") });
    const pageB = await ctxB.newPage();
    await pageB.goto("/friends", { waitUntil: "domcontentloaded" });
    const chatTab = pageB.getByRole("button", { name: /채팅/ });
    await expect(chatTab.locator("span").filter({ hasText: /^\d+/ })).toBeVisible({
      timeout: 15_000,
    });
    await ctxB.close();
  });

  test("26 · 실시간 읽음 B 입장 → A 말풍선 읽음 표시", async ({ browser, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("read-receipt");
    await sendMessage(request, pair.tokenA, pair.conversationId, text);

    const ctxA = await browser.newContext({ storageState: authFile("newHost") });
    const pageA = await ctxA.newPage();
    await gotoChatRoom(pageA, pair.conversationId);
    const msgRow = pageA.getByTestId("chat-message").filter({ hasText: text });
    await expect(msgRow).toBeVisible();
    await expect(msgRow.getByTestId("read-receipt")).toBeVisible();

    const ctxB = await browser.newContext({ storageState: authFile("guest") });
    const pageB = await ctxB.newPage();
    await gotoChatRoom(pageB, pair.conversationId);
    await pageB.waitForTimeout(2500);

    await expect(msgRow.getByTestId("read-receipt")).toBeHidden({ timeout: 10_000 });
    await ctxA.close();
    await ctxB.close();
  });

  test("27 · 길게누르기 → 답장 → 인용 UI + 전송", async ({ page, request }) => {
    const baseText = uniqueDmText("reply-base");
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B, {
      seedMessage: baseText,
      seedFrom: "B",
    });
    const replyText = uniqueDmText("reply-ui");
    await gotoChatRoom(page, pair.conversationId);
    const seedRow = page.locator("li").filter({ hasText: baseText }).last();
    await longPress(seedRow.locator("div").filter({ hasText: baseText }).first());
    await page.getByRole("button", { name: "답장" }).click();
    await expect(page.getByText("에게 답장")).toBeVisible();
    await page.getByPlaceholder("메시지를 입력하세요").fill(replyText);
    await page.getByRole("button", { name: "전송" }).click();
    await expect(page.locator("li").filter({ hasText: replyText })).toBeVisible();
  });

  test("28 · 길게누르기 → 수정 → 수정됨 라벨", async ({ page, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const original = uniqueDmText("edit-ui");
    await sendMessage(request, pair.tokenA, pair.conversationId, original);
    await gotoChatRoom(page, pair.conversationId);
    const row = page.locator("li").filter({ hasText: original }).last();
    await longPress(row.locator("div").filter({ hasText: original }).first());
    await page.getByRole("button", { name: "수정" }).click();
    const updated = uniqueDmText("edited-ui");
    await page.getByPlaceholder("수정 메시지 입력").fill(updated);
    await page.getByRole("button", { name: "수정 완료" }).click();
    const updatedRow = page.locator("li").filter({ hasText: updated }).last();
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByText("수정됨")).toBeVisible();
  });

  test("29 · 길게누르기 → 삭제 → 삭제된 메시지입니다", async ({ page, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B);
    const text = uniqueDmText("delete-ui");
    await sendMessage(request, pair.tokenA, pair.conversationId, text);
    await gotoChatRoom(page, pair.conversationId);
    const row = page.locator("li").filter({ hasText: text }).last();
    await longPress(row.locator("div").filter({ hasText: text }).first());
    await page.getByRole("button", { name: "삭제" }).first().click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: "삭제" }).click();
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
    await expect(
      page.locator("li").filter({ hasText: "삭제된 메시지입니다" }).last(),
    ).toBeVisible();
  });

  test("30 · ChatList 나가기 → 상대 재전송 시 재등장", async ({ page, browser, request }) => {
    const pair = await setupDmPair(request, DM_USER_A, DM_USER_B, {
      seedMessage: uniqueDmText("leave-ui"),
    });
    await openChatTab(page);
    const row = page.getByRole("button").filter({ hasText: pair.partnerNameB ?? "" }).first();
    await longPress(row);
    await page.getByRole("button", { name: "나가기" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "나가기" }).click();
    await expect(row).toBeHidden({ timeout: 10_000 });

    const comeback = uniqueDmText("comeback");
    await sendMessage(request, pair.tokenA, pair.conversationId, comeback);

    const ctxB = await browser.newContext({ storageState: authFile("guest") });
    const pageB = await ctxB.newPage();
    await openChatTab(pageB);
    await expect(pageB.getByText(comeback, { exact: false })).toBeVisible({ timeout: 15_000 });
    await ctxB.close();
  });
});
