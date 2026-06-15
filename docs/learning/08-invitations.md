# 08. 초대장 도메인

> WARA의 심장. 다른 모든 도메인이 `invitationId`로 매달려 있다.

---

## 1. 도메인 한눈에

```
users ─────┐  (호스트로 생성)
           ▼
       invitations  ───────────────┐
        ├─ template_id              │
        ├─ event_start_at           │
        ├─ status                   │
        └─ ...                      │
                                    │
       participants                 │  (membership)
        ├─ invitation_id  ──────────┤
        ├─ user_id                  │
        ├─ memberRole: HOST | GUEST │
        ├─ rsvpStatus               │
        └─ ...                      │
                                    │
       event_locations  ────────────┤  (모임 장소)
       photos  ────────────────────┤   (사진 앨범)
       date_vote_polls  ───────────┤   (날짜 투표)
       ai_image_jobs  ─────────────┤   (AI 메인 이미지)
       conversations(invitationId X — 별도) │
       missions  ──────────────────┘   (게스트 미션)
```

→ "초대장 도메인을 모르면 다른 도메인을 못 본다"는 말이 그래서 나옴.

---

## 2. invitations 테이블 핵심 컬럼

`apps/api/src/database/schema/invitations.ts:22`:
```ts
export const invitations = pgTable('invitations', {
  id:           text('id').primaryKey().$defaultFn(() => ulid()),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  templateId:   text('template_id').references(() => invitationTemplates.id, { onDelete: 'set null' }),
  status:       invitationStatusEnum('status').notNull().default('active'),
  title:        varchar('title', { length: 100 }).notNull(),
  description:  text('description').notNull(),
  mainCoverType: mainCoverTypeEnum('main_cover_type').notNull().default('image'),
  mainImageKey: text('main_image_key'),
  mainImageThumbnailKey: text('main_image_thumbnail_key'),
  mainGifUrl:   text('main_gif_url'),
  eventStartAt: timestamp('event_start_at', { withTimezone: true }),
  isMissionEnabled: boolean('is_mission_enabled').notNull().default(false),
  // RSVP 라벨 (호스트 커스터마이즈 가능)
  rsvpAttendingEmoji: ..., rsvpAttendingLabel: ...,
  // 모임 옵션
  fee:        varchar('fee', { length: 100 }),
  dressCode:  varchar('dress_code', { length: 100 }),
  // 탐색
  isPublic:   boolean('is_public').notNull().default(false),
  category:   varchar('category', { length: 20 }),
  viewCount:  integer('view_count').notNull().default(0),
  // 메타
  createdAt:  timestamp(...).notNull().defaultNow(),
  updatedAt:  timestamp(...).notNull().defaultNow(),
  deletedAt:  timestamp(...),
}, (t) => [
  check('check_cover_type_image', sql`${t.mainCoverType} <> 'image' OR (${t.mainImageKey} IS NOT NULL AND ${t.mainGifUrl} IS NULL)`),
  check('check_cover_type_gif',   sql`${t.mainCoverType} <> 'gif'   OR (${t.mainGifUrl} IS NOT NULL AND ${t.mainImageKey} IS NULL)`),
  index('idx_invitations_user_id').on(t.userId),
  index('idx_invitations_public_explore').on(t.isPublic, t.category),
]);
```

### 디자인 포인트

#### (1) `onDelete: 'restrict'` for userId
유저를 hard delete하면 초대장이 고아됨 → 막음. WARA는 soft delete만 허용하므로 사실상 막힐 일 없음.

#### (2) `mainCoverType` + 체크 제약
- 커버는 이미지 또는 GIF 둘 중 하나
- DB 레벨 `check` 제약으로 둘 다 채워지거나 둘 다 비는 상황 차단

#### (3) `eventStartAt` nullable
- 처음엔 null → 날짜 투표로 확정되면 set
- date-vote가 `eventStartAt`을 보고 "이미 확정됨" 검증 (`VOTE_EVENT_DATE_SET`)

#### (4) `isPublic` + `category`
- false면 링크 받은 사람만 접근 (비공개)
- true면 탐색 페이지에 노출 — `(isPublic, category)` 복합 인덱스로 필터

#### (5) `viewCount`
- 탐색 페이지의 "조회순" 정렬용
- 매 조회마다 +1 (현재 단순 update — race condition 가능성 있음, todo의 race 보강 후보 중 하나)

---

## 3. participants — 멤버십 모델

```ts
export const participants = pgTable('participants', {
  id:            text('id').primaryKey().$defaultFn(() => ulid()),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitationId:  text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  memberRole:    memberRoleEnum('member_role').notNull(),      // 'host' | 'guest'
  rsvpStatus:    rsvpStatusEnum('rsvp_status').notNull().default('undecided'),
  isHidden:      boolean('is_hidden').notNull().default(false),
  note:          text('note'),
  hostMemo:      text('host_memo'),
  createdAt:     timestamp(...).notNull().defaultNow(),
  updatedAt:     timestamp(...).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_participants_user_invitation').on(t.userId, t.invitationId),
  index('idx_participants_invitation_id').on(t.invitationId),
]);
```

### 핵심 개념

#### `memberRole`: HOST vs GUEST
- HOST = 초대장 주인 (편집·삭제·미션 배정 권한)
- GUEST = 초대 받은 사람
- 초대장 1개에 HOST 1명, GUEST N명
- HOST는 RSVP 변경 불가 (`RSVP_PERMISSION_DENIED`)

#### `rsvpStatus`
- `undecided` (기본) → `attending` / `maybe` / `declined` / `absent`
- `absent`는 호스트가 명시적으로 "참석 안 함" 표시 → 그 게스트는 초대장 열람 자체 불가

#### unique index `(userId, invitationId)`
- 같은 사용자가 같은 초대장에 두 번 참가 못 함
- `PARTICIPANT_ALREADY_EXISTS` 에러로 표면화

#### leftmost rule 이슈
unique 인덱스 `(userId, invitationId)`는 **userId가 첫 컬럼**이므로 `invitationId` 단독 조회에 사용 못 함.
→ "이 초대장의 참가자 목록"이 자주 호출되므로 `idx_participants_invitation_id` 별도 추가.

---

## 4. 핵심 비즈니스 규칙

### (1) HOST는 단 1명
- 같은 초대장에 `memberRole='host'`인 row가 2개 이상 → 데이터 깨짐
- 코드 레벨에서 보장 (DB unique 제약은 미적용 — 현재 부분 인덱스로 강제하지 않음)

### (2) HOST는 탈퇴할 수 없다
- `HOST_CANNOT_LEAVE` (400)
- 권한 이전 후 게스트로 격하 → 탈퇴

### (3) HOST의 호스트 권한 이전
- 다른 게스트에게 위임
- `PARTICIPANT_ALREADY_HOST` (이미 호스트인 게스트에게 위임 차단)
- 현재 미구현 (todo 보류) → `USER_HAS_HOSTED_INVITATIONS`로 탈퇴 차단되는 원인

### (4) 초대장 마감 (`status='closed'`)
- closed 상태에서는 참가/RSVP 변경 불가 (`INVITATION_CLOSED`, 422)

### (5) Blocklist (차단 사용자)
- 호스트가 특정 사용자를 차단 → 그 사용자는 해당 초대장 접근 거부 (`INVITATION_ACCESS_REVOKED`, 403)
- `BlocklistGuard`가 변경 요청 시 자동 체크

---

## 5. 낙관적 락 — `expectedUpdatedAt`

### 문제
호스트 A와 호스트 B(공동 호스트는 없지만 가정)가 동시에 초대장을 편집 → 늦게 저장한 쪽이 먼저 저장한 변경을 덮어씀.

### 해결
클라이언트가 PATCH 요청에 `expectedUpdatedAt`을 함께 보냄.

```ts
PATCH /invitations/:id
{
  "title": "새 제목",
  "expectedUpdatedAt": "2026-06-13T12:34:56.789Z"
}
```

서버:
```ts
const result = await db.update(invitations)
  .set({ title, updatedAt: new Date() })
  .where(and(
    eq(invitations.id, id),
    eq(invitations.updatedAt, expectedUpdatedAt)   // ← 핵심
  ))
  .returning();

if (result.length === 0) {
  // updatedAt이 다름 = 다른 세션이 먼저 수정함
  throw new ConflictException({ code: ErrorCode.INVITATION_VERSION_CONFLICT });
}
```

→ 클라이언트는 최신 상태 재조회 후 재시도 안내.

이 패턴은 **PR #239에서 도입**, 다른 엔티티(mission/date-vote)로 확장 예정 (todo 보류).

---

## 6. 자주 보는 가드

### HostGuard
- 라우트 path에 `:invitationId` 포함
- 호출자가 그 초대장의 HOST인지 검증 → 아니면 `INSUFFICIENT_ROLE`

### ParticipantGuard
- 호출자가 그 초대장의 참가자(HOST or GUEST)인지

### BlocklistGuard
- 변경 요청에 적용
- 차단당한 사용자면 403

---

## 7. 흔한 함정

### participants 동시 생성 race
같은 사용자가 동시에 "참가" 두 번 누르면 unique violation 발생. 정상 — 두 번째 요청에 `PARTICIPANT_ALREADY_EXISTS`로 변환.

### `eventStartAt` set 후 date-vote 생성
이미 확정된 초대장에 투표 생성 시도 → `VOTE_EVENT_DATE_SET` (422).

### Soft delete된 초대장 조회
모든 query에 `where(isNull(deletedAt))` 빠뜨리면 삭제된 초대장도 노출. 반복 작업이라 helper로 묶는 게 좋다.

### HOST 권한 이전 미구현 상태에서 탈퇴 요청
`USER_HAS_HOSTED_INVITATIONS` (400) — 사용자가 직접 호스트 권한 이전 후 다시 시도해야 함.

---

## 8. 체크리스트

- [ ] invitations / participants 두 테이블 구조를 그릴 수 있다
- [ ] HOST vs GUEST의 권한 차이를 설명할 수 있다
- [ ] `mainCoverType` 체크 제약이 뭘 보장하는지 안다
- [ ] `expectedUpdatedAt` 낙관적 락의 흐름을 안다
- [ ] BlocklistGuard / HostGuard / ParticipantGuard의 차이를 안다

→ 다음: [09. 사진 앨범](./09-photos-album.md)
