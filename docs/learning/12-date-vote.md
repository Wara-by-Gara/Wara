# 12. 날짜 투표

> "각자 가능한 날짜를 골라" → 호스트가 확정. 3개 테이블이 깔끔하게 분리되어 있다.

---

## 1. 도메인 한눈에

```
invitations (1) ─── (1) date_vote_polls (마감, 익명 여부, 확정 슬롯)
                            │
                            │ (1:N)
                            ▼
                       date_vote_slots (날짜 + 시간 후보)
                            │
                            │ (1:N)
                            ▼
                       date_vote_responses (참가자별 응답)
```

---

## 2. 테이블 — `schema/date-votes.ts`

### `date_vote_polls`
```ts
export const dateVotePolls = pgTable('date_vote_polls', {
  id:              text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId:    text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  closesAt:        timestamp('closes_at', { withTimezone: true }).notNull(),
  status:          dateVotePollStatusEnum('status').notNull().default('open'),
  isAnonymous:     boolean('is_anonymous').notNull().default(false),
  confirmedSlotId: text('confirmed_slot_id'),                     // ← FK 아님
  reminderSentAt:  timestamp('reminder_sent_at', { withTimezone: true }),
  ...
}, (t) => [
  uniqueIndex('uq_date_vote_polls_invitation').on(t.invitationId),  // ← 초대장당 1개
  index('idx_date_vote_polls_status').on(t.status),
  index('idx_date_vote_polls_closes_at').on(t.closesAt),
]);
```

#### `uq_date_vote_polls_invitation`
- 초대장당 투표 1개만
- 이미 있는데 다시 만들면 `VOTE_POLL_ALREADY_EXISTS`

#### `confirmedSlotId` — FK 없이 text
- 정상 패턴이면 `references(() => dateVoteSlots.id)`로 FK를 거는 게 맞음
- 그런데 polls ↔ slots가 서로 참조 → 순환 FK
- 회피책: text만 두고 코드 레벨에서 무결성 보장

#### `reminderSentAt`
- 마감 30분 전 리마인더 1회만 보내기 위한 플래그
- crontab 잡이 polls를 polling, 발송 후 채움

#### `status` enum
- `open` → 마감 시각 전, 응답 받는 중
- `closed` → 마감 (자동 또는 호스트가 닫음)
- `confirmed` → 호스트가 날짜 확정 (confirmedSlotId set)

### `date_vote_slots`
```ts
export const dateVoteSlots = pgTable('date_vote_slots', {
  id:        ...,
  pollId:    text('poll_id').notNull().references(() => dateVotePolls.id, { onDelete: 'cascade' }),
  date:      date('date').notNull(),               // 'YYYY-MM-DD'
  startTime: varchar('start_time', { length: 5 }), // 'HH:MM', null = 종일
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: ...,
});
```

#### `startTime` nullable = 종일
- 시간 미지정 슬롯
- 종일 + 같은 날짜의 11:00 슬롯 같이 있을 수 있음

### `date_vote_responses`
```ts
export const dateVoteResponses = pgTable('date_vote_responses', {
  id:            ...,
  slotId:        text('slot_id').notNull().references(() => dateVoteSlots.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  response:      dateVoteResponseEnum('response').notNull(),  // 'good' | 'maybe' | 'bad'
  ...
}, (t) => [
  uniqueIndex('uq_date_vote_responses_slot_participant').on(t.slotId, t.participantId),
]);
```

#### unique `(slotId, participantId)`
- 한 참가자가 한 슬롯에 대해 1개 응답
- 변경은 같은 row UPDATE (응답 교체)

---

## 3. 비즈니스 규칙

### (1) 슬롯 30개 한도
- 31번째 추가 시 `VOTE_SLOT_LIMIT_EXCEEDED` (422)

### (2) 같은 (date, startTime) 슬롯 중복 금지
- DB 제약은 없음 → 코드 레벨에서 검증
- 위반 시 `VOTE_SLOT_DUPLICATE`

### (3) eventStartAt이 이미 set이면 투표 생성 불가
- 날짜가 이미 확정된 초대장 → `VOTE_EVENT_DATE_SET`
- 흐름상 투표는 날짜 미정 단계에서만 의미 있음

### (4) closed/confirmed 상태에서 응답 수정 불가
- `VOTE_POLL_CLOSED` (422)

### (5) 날짜 확정은 closed 상태에서만
- open 상태에서 확정 시도 → `VOTE_POLL_CLOSED` (역설적 이름)
- 의도: 호스트가 "마감"을 명시적으로 누른 다음에만 확정

---

## 4. 흐름

### 생성
```
[1] 호스트 → POST /invitations/:id/date-vote
              { closesAt, isAnonymous, slots: [...] }
[2] 서버
     ├─ invitation의 eventStartAt이 null인지 확인 (VOTE_EVENT_DATE_SET 검증)
     ├─ 트랜잭션:
     │   ├─ dateVotePolls INSERT
     │   └─ dateVoteSlots INSERT (slots 배열)
     └─ 응답
```

### 응답 (게스트가 투표)
```
[1] 게스트 → PUT /date-vote/:pollId/responses
              { responses: [{ slotId, response }, ...] }
[2] 서버
     ├─ poll status 확인 (open인지)
     ├─ 각 응답 UPSERT (unique 제약 활용)
     └─ 결과 통계 갱신 (집계는 query time)
```

### 마감 (자동 또는 호스트)
```
자동:
  cron 잡이 polls 스캔 → closesAt 지난 open 폴을 closed로 전환

호스트:
  POST /date-vote/:pollId/close
```

### 확정
```
[1] 호스트 → POST /date-vote/:pollId/confirm { slotId }
[2] 서버
     ├─ poll status === 'closed' 확인 (open이면 VOTE_POLL_CLOSED)
     ├─ slot이 그 poll에 속하는지 확인 (VOTE_SLOT_NOT_FOUND)
     ├─ 트랜잭션:
     │   ├─ polls.confirmedSlotId, status='confirmed' UPDATE
     │   └─ invitations.eventStartAt = slot의 date + startTime
     └─ 알림 발송
```

---

## 5. 익명 투표 (`isAnonymous`)

- true면 응답 조회 시 `participantId` 숨김 (집계만 반환)
- 호스트 본인의 응답은 본인 마음대로 (익명 의미 없음)
- 응답 페이지에서 "누가 어디 골랐는지" UI는 익명이면 숨김

---

## 6. 리마인더

### 의도
- 마감 30분 전 미응답 게스트에게 자동 알림

### 구현
- cron 잡이 주기적으로 polls 스캔
- `closesAt < now + 30min` AND `reminderSentAt IS NULL`인 폴 찾음
- 미응답 참가자에게 알림 발송
- `reminderSentAt = now()` 갱신

→ 중복 발송 방지가 핵심.

---

## 7. 응답 통계

### 단순 집계
```sql
SELECT
  s.id, s.date, s.start_time,
  COUNT(*) FILTER (WHERE r.response = 'good')  AS good_count,
  COUNT(*) FILTER (WHERE r.response = 'maybe') AS maybe_count,
  COUNT(*) FILTER (WHERE r.response = 'bad')   AS bad_count
FROM date_vote_slots s
LEFT JOIN date_vote_responses r ON r.slot_id = s.id
WHERE s.poll_id = ?
GROUP BY s.id
```

→ `participants` 수가 작아 `COUNT(*)`로 충분. 캐시 X.

---

## 8. 흔한 함정

### 확정 후 date-vote-poll 수정
- confirmed 상태는 immutable
- 모든 변경 요청 차단

### slot 삭제 시 responses 자동 cascade
- FK `onDelete: 'cascade'` → 응답도 같이 삭제
- 호스트가 슬롯 지우면 그 슬롯의 표 사라짐 → 의도된 동작

### 마감 자동화 누락
- cron 잡이 멎으면 closesAt 지나도 open 상태로 남음
- → 호스트가 "확정" 시도 시 `VOTE_POLL_CLOSED`로 차단되어 막힘
- 헬스체크에 cron 동작 여부 포함 권장

---

## 9. 체크리스트

- [ ] 3개 테이블(polls / slots / responses)의 역할을 안다
- [ ] `confirmedSlotId`가 FK 아닌 이유 (순환 회피)를 안다
- [ ] `(slotId, participantId)` unique로 응답 교체가 자연스러운 이유를 안다
- [ ] `status` enum의 3단계(open → closed → confirmed)를 안다
- [ ] 확정 시 `invitations.eventStartAt`이 set되는 흐름을 안다

→ 다음: [13. 로그인 요청 워크스루](./13-walkthrough-login.md)
