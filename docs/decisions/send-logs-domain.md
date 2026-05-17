# Send Logs 도메인 설계

> mettPocock 설계 단계 산출물.
> Gstack → Superpowers 순서로 구현 진행.

---

## 1. Ubiquitous Language

```
SendLog         = InvitationSendLog row. 초대장 공유 1회 기록
channel         = 공유 채널 (link | kakao | sms | email | dm)
                  dm = 인스타그램·트위터 등 외부 메신저 DM 통합. WARA 앱 내 DM 아님 (V1.1+)
inviteUrl       = 서버 자동 생성. DB엔 ref 없이 저장, 응답 시 ?ref={logId} 추가
                  예) DB: "https://wara.com/invite/{invitationId}"
                      응답: "https://wara.com/invite/{invitationId}?ref={logId}"
                  ref={logId} → 방문자가 어떤 공유 링크를 통해 들어왔는지 추적용
sender          = JWT에서 추출한 공유 요청자. HOST 또는 초대장 참여 GUEST
LinkEvent       = 링크 상호작용 이벤트 row. 클릭/참가 등 1건 = 1row
eventType       = opened | login_converted | joined
```

> **`status` 컬럼 제거**: 기존 `invitation_send_logs.status`는 이벤트 테이블과 데이터가 중복되어 제거.
> "이 공유로 누가 열었나?" 는 `invitation_link_events`가 단일 진실의 원천.

---

## 2. 엔드포인트 계약

| 메서드 | 경로 | 인증 | 권한 | 설명 |
|--------|------|:----:|:----:|------|
| GET | `/invitations/:invitationId/logs` | ✅ | HOST만 | 전송 이력 전체 조회 |
| POST | `/invitations/:invitationId/logs` | ✅ | HOST + GUEST | 공유 로그 기록 + 채널별 메타 응답 |
| PATCH | `/invitations/:invitationId/logs/:logId/open` | ❌ | 누구나 | 링크 방문 이벤트 기록 |

> **GET은 HOST만, POST는 참여자 모두**: HOST가 공유 현황 전체를 보는 건 대시보드 성격. GUEST도 공유는 할 수 있지만 타인의 공유 이력은 볼 필요 없음.
>
> **GUEST POST 허용 이유**: 친구 모임에서 GUEST가 다른 친구에게 링크를 전달하는 바이럴 흐름을 추적하기 위함. Guard 1줄(`ParticipantGuard`)로 처리.
>
> **PATCH /open은 기존 API 명세에 없던 신규 엔드포인트**: 방문자가 비로그인 상태일 수 있으므로 인증 불필요. userId는 항상 null.

---

## 3. 레이어 타입 계약

### Controller → Service

```typescript
findAll(invitationId: string): Promise<SendLog[]>

create(
  userId: string,
  invitationId: string,
  dto: CreateSendLogDto,          // { channel }
): Promise<SendLogWithMeta>

recordOpen(logId: string): Promise<void>
```

### Service → Repository

```typescript
// SendLogsRepository
findAllByInvitation(invitationId: string): Promise<SendLog[]>

create(data: {
  invitationId: string
  senderId: string
  channel: SendChannel
  inviteUrl: string               // ?ref 없이 저장
}): Promise<SendLog>

findInvitationMeta(invitationId: string): Promise<{
  title: string
  description: string
  mainImageKey: string
} | null>

// LinkEventsRepository
createEvent(data: {
  logId: string
  eventType: LinkEventType        // V1.0: 'opened'만 사용. 'login_converted'는 V1.1+
}): Promise<void>
```

---

## 4. 응답 타입

### GET `/logs`

```typescript
Array<{
  id: string
  channel: 'link' | 'kakao' | 'sms' | 'email' | 'dm'
  inviteUrl: string | null
  createdAt: string
  // senderId 미포함 — HOST 본인이 보내는 것이므로 불필요
}>
```

### POST `/logs` — 채널별 메타 포함

```typescript
// 공통 필드
{
  logId: string
  channel: SendChannel
  inviteUrl: string               // https://wara.com/invite/{id}?ref={logId}
}

// kakao 추가
+ kakaoMeta: {
    title: string                 // invitation.title
    description: string           // invitation.description
    imageUrl: string              // CDN base + invitation.mainImageKey
  }

// sms 추가
+ smsUri: string                  // "sms:?body=..." (서버에서 인코딩)

// link | dm | email — 공통 필드만
```

### PATCH `/open`

```typescript
204 No Content
```

---

## 5. DB 스키마 변경사항

### `invitation_send_logs` — `status` 컬럼 제거

**제거 이유**: `status(sent|opened|responded|failed)`는 이벤트 테이블과 동일 정보 중복.
이벤트 테이블이 단일 진실의 원천이므로 `status` 컬럼은 dead weight.

```sql
-- migration 수동 실행
ALTER TABLE invitation_send_logs DROP COLUMN status;
```

Drizzle 스키마에서도 `status` 컬럼 및 `sendStatusEnum` 사용 제거.

> **`sendStatusEnum` 처리**: `invitation_send_logs`에서만 사용 중이므로 컬럼 제거 후 `DROP TYPE send_status`도 함께 실행.

### `invitation_link_events` — 신규 테이블

```typescript
export const linkEventTypeEnum = pgEnum('link_event_type', [
  'opened',           // 링크 클릭 (비로그인 포함)
  'login_converted',  // 링크 통해 로그인까지 진행
  'joined',           // 링크 통해 RSVP까지 완료
]);

export const invitationLinkEvents = pgTable('invitation_link_events', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  logId: text('log_id')
    .notNull()
    .references(() => invitationSendLogs.id, { onDelete: 'cascade' }),
  eventType: linkEventTypeEnum('event_type').notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  // 비로그인 방문자는 null. 로그인 유저면 채움.
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index('idx_link_events_log_id').on(t.logId),
  index('idx_link_events_type').on(t.eventType),
]);
```

---

## 6. Level 3 선택 근거 및 캐시 컬럼 확장 플랜

### 왜 Level 3인가

이벤트 테이블만 유지하고 집계 캐시 컬럼(`open_count`, `join_count`)은 두지 않는다.

| 항목 | Level 2.5 (캐시 컬럼 있음) | Level 3 (현재 선택) |
|------|:------------------------:|:-------------------:|
| 단톡방 공유 추적 | ✅ | ✅ |
| 조회 속도 | 빠름 (단순 SELECT) | 충분 (인덱스 기반 JOIN) |
| 쓰기 비용 | INSERT + UPDATE 2번 | INSERT 1번 |
| 코드 복잡도 | 높음 (동기화 로직) | 낮음 |
| 정합성 리스크 | 있음 (UPDATE 실패 시 불일치) | 없음 |

WARA V1.0 규모에서 `invitation_link_events`는 로그당 수십 건 수준.
`log_id` 인덱스 기반 GROUP BY 집계는 수 ms 이내로 성능 충분.

### 캐시 컬럼이 필요해지는 시점

초대장 통계 대시보드 API가 생기거나 초당 수천 건 이상의 조회가 발생할 때.

### 나중에 캐시 컬럼 추가하는 방법 (30분 작업)

**Step 1 — 마이그레이션**
```sql
ALTER TABLE invitation_send_logs
  ADD COLUMN open_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN join_count  integer NOT NULL DEFAULT 0;
```

**Step 2 — 기존 데이터 백필**
```sql
UPDATE invitation_send_logs l
SET
  open_count = (
    SELECT COUNT(*) FROM invitation_link_events
    WHERE log_id = l.id AND event_type = 'opened'
  ),
  join_count = (
    SELECT COUNT(*) FROM invitation_link_events
    WHERE log_id = l.id AND event_type = 'joined'
  );
```

**Step 3 — 이벤트 INSERT 시 카운터 동기화 추가**
```typescript
await db.insert(invitationLinkEvents).values(data);
await db
  .update(invitationSendLogs)
  .set({ openCount: sql`open_count + 1` })
  .where(eq(invitationSendLogs.id, data.logId));
```

---

## 7. Guard 인프라

엔드포인트별 Guard가 다르다.

```
GET /logs
  JwtAuthGuard → HostGuard (@MemberRole(HOST)) → Controller

POST /logs
  JwtAuthGuard → ParticipantGuard (HOST + GUEST 모두) → Controller

PATCH /open
  @Public() — JwtAuthGuard 우회. userId 항상 null.
```

신규 Guard 없음. 기존 `HostGuard` 재사용.

---

## 8. 권한 매트릭스

| 엔드포인트 | HOST | GUEST | 비로그인 |
|-----------|:----:|:-----:|:-------:|
| GET /logs (전체 이력) | ✅ | ❌ | ❌ |
| POST /logs (공유 기록) | ✅ | ✅ | ❌ |
| PATCH /open (방문 기록) | ✅ | ✅ | ✅ |

> **GUEST 조회 제한 이유**: 공유 이력은 HOST의 모임 운영 정보. 타 참여자의 공유 횟수를 GUEST가 볼 이유 없음.
> V1.1에서 본인 공유 이력만 조회하는 `GET /logs?mine=true` 추가 가능.

---

## 9. 비즈니스 규칙

| 작업 | 규칙 |
|------|------|
| POST | `channel`만 body로 받음. `inviteUrl`은 서버 자동 생성 |
| POST | DB 저장: `https://wara.com/invite/{invitationId}` (ref 없이) |
| POST | 응답: `inviteUrl`에 `?ref={logId}` 추가해서 반환 |
| POST | kakao 채널: `findInvitationMeta()` 조회 후 `kakaoMeta` 구성 |
| POST | sms 채널: `smsUri = sms:?body={encodeURIComponent(message)}` |
| GET | `createdAt DESC` 정렬 |
| PATCH /open | `invitation_link_events`에 `eventType: 'opened'`, `userId: null` INSERT |

---

## 10. 이벤트 기록 흐름

```
[공유]
1. HOST 또는 GUEST → POST /logs { channel: "kakao" }
2. 서버 → invitation_send_logs INSERT
3. 서버 → 201 { inviteUrl: "...?ref={logId}", kakaoMeta: {...} }

[방문]
4. 방문자가 링크 클릭
5. 프론트 → PATCH /logs/{logId}/open
6. 서버 → invitation_link_events INSERT { eventType: 'opened', userId: null }

[참가 — V1.1, participants 도메인 연동]
7. 방문자 RSVP 시 POST /participants body에 refLogId?: string 포함
8. participants.service → linkEventsRepository.createEvent({ eventType: 'joined', userId })
```

---

## 11. 이 설계로 답할 수 있는 분석 질문

| 질문 | 방법 |
|------|------|
| 채널별 공유 횟수 | `invitation_send_logs` GROUP BY channel |
| 공유 → 방문 전환율 | `link_events(opened)` / `send_logs` COUNT |
| 방문 → 참가 전환율 | `link_events(joined)` / `link_events(opened)` |
| GUEST 바이럴 기여 | `send_logs` WHERE senderId = GUEST |
| HOST vs GUEST 공유 비율 | `send_logs` JOIN `participants` ON memberRole |
| 시간대별 오픈 분포 | `link_events(opened)` GROUP BY hour(createdAt) |

---

## 12. 에러 코드

신규 에러 코드 없음.
- HOST 권한 오류: `HostGuard` 기존 로직 처리
- 참여자 권한 오류: `ParticipantGuard` 기존 로직 처리

---

## 13. 변경 파일 목록

### DB / 스키마
- `drizzle/schema/enums.ts` — `linkEventTypeEnum` 추가, `sendStatusEnum` 제거
- `drizzle/schema/invitations.ts` — `status` 컬럼 제거, `invitationLinkEvents` 테이블 추가
- `drizzle/schema/index.ts` — `InvitationLinkEvent` 타입 export 추가
- migration 2개:
  - `invitation_send_logs.status` DROP + `DROP TYPE send_status`
  - `invitation_link_events` 테이블 CREATE

### Send Logs 도메인 (신규)
- `src/send-logs/send-logs.module.ts`
- `src/send-logs/send-logs.controller.ts`
- `src/send-logs/send-logs.service.ts`
- `src/send-logs/send-logs.repository.ts`
- `src/send-logs/link-events.repository.ts`
- `src/send-logs/dto/create-send-log.dto.ts`

### 수정
- `src/app.module.ts` — `SendLogsModule` 등록

---

## 14. V1.0 제외 항목

| 항목 | 이유 |
|------|------|
| `login_converted` 이벤트 | WARA RSVP는 무조건 로그인 필요 → `joined`로 충분. 프론트 ref 파라미터 유지 비용 대비 가치 낮음. V1.1+ (§15 참조) |
| `joined` 이벤트 | participants 도메인 구현 시 연동. 현재 scope 밖 |
| `GET /logs?mine=true` (GUEST 본인 이력 조회) | 수요 확인 후 V1.1+ |
| 채널별 통계 대시보드 API | admin 도메인으로 분리, V1.1+ (§16 참조) |
| 캐시 컬럼 (`open_count`, `join_count`) | 현재 트래픽 규모에서 불필요. V1.1+ (추가 방법 §6 참조) |
| OG 태그 생성 | Next.js `generateMetadata()`로 프론트 처리. 백엔드 불필요 |

---

## 15. 팀 논의 포인트

### `login_converted` 이벤트 도입 여부 (V1.1+)

WARA에서 RSVP(참석·미정·불참)는 모두 로그인이 선행된다.
`joined` 이벤트가 기록됐다면 로그인도 된 것이 보장되므로 `login_converted`의 독립적 가치가 낮다.

추가 가치가 생기는 시점: "로그인했지만 RSVP를 제출하지 않고 이탈한 경우"를 추적하고 싶을 때.

구현 시 필요한 것:
- 프론트에서 로그인 완료 후에도 `?ref={logId}` 파라미터 유지
- `PATCH /logs/:logId/login-converted` 엔드포인트 추가 (JwtAuthGuard)
- DB enum에는 이미 `login_converted` 값이 존재하므로 migration 불필요

---

### SMS URI 생성 주체

**Option A: 서버 생성 (현재 결정)**
```
smsUri: "sms:?body=WARA%20초대장%0A..."
```
- 장점: 클라이언트 인코딩 로직 불필요, 메시지 포맷 통일
- 단점: iOS(`sms:`) / Android(`smsto:`) URI 스펙 차이 있음

**Option B: 클라이언트 생성**
- 장점: 플랫폼별 처리 클라이언트가 직접 담당
- 단점: 메시지 포맷 분산

현재 결정: **Option A** — 서버에서 기본 URI 생성. 플랫폼 분기 필요 시 `platform` 쿼리 파라미터 추가.

---

## 16. 플랫폼 관리자 Analytics 엔드포인트 (V1.1+ 예시)

> **구현 대상 아님.** admin 대시보드 UI 개발 시점에 별도 `admin` 도메인으로 구현.
> V1.0부터 데이터가 쌓이므로 소급 분석 가능.
> Guard: `userRole = admin` (JWT에서 role 확인)

### 예시 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/analytics/shares/channels` | 전체 채널별 공유 횟수 |
| GET | `/admin/analytics/shares/conversion` | 공유 → 방문 → 로그인 → 참가 전환율 |
| GET | `/admin/analytics/shares/viral` | GUEST 바이럴 기여 비율 |
| GET | `/admin/analytics/shares/timeline` | 시간대별 오픈 분포 |

### 각 엔드포인트가 답하는 질문

```
GET /admin/analytics/shares/channels
  → 채널별 공유 횟수: invitation_send_logs GROUP BY channel

GET /admin/analytics/shares/conversion
  → 공유 → 방문 전환율: link_events(opened) / send_logs COUNT
  → 방문 → 로그인 전환율: link_events(login_converted) / link_events(opened)
  → 로그인 → 참가 전환율: link_events(joined) / link_events(login_converted)

GET /admin/analytics/shares/viral
  → GUEST 바이럴 기여: send_logs WHERE senderId IN (GUEST participants)
  → HOST vs GUEST 공유 비율: send_logs JOIN participants ON memberRole

GET /admin/analytics/shares/timeline
  → 시간대별 오픈 분포: link_events(opened) GROUP BY hour(createdAt)
```
