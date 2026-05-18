# Send Logs 도메인 — Gstack

> mettPocock 설계 기반 구현 체크리스트.
> 위에서 아래로 순서대로 진행 (의존성 순서).

---

## 0. DB 마이그레이션

스키마 수정 → `pnpm db:generate` → SQL 검토 → `pnpm db:migrate` 순서로 진행.
두 마이그레이션은 별도 파일로 분리.

### [0-A] `status` 컬럼 제거 + `send_status` 타입 삭제 + `invite_url` NOT NULL 변경

Drizzle이 enum DROP TYPE을 누락할 수 있으므로 생성된 SQL에 아래 구문 포함 여부 확인 후 없으면 수동 추가.

```sql
ALTER TABLE invitation_send_logs DROP COLUMN status;
DROP TYPE send_status;
```

`invite_url` 컬럼은 현재 nullable이지만 서비스에서 항상 생성하므로 이 시점에 함께 NOT NULL로 변경 권장.
기존 null 행이 없으면 아래 구문 추가. null 행 여부는 `SELECT COUNT(*) FROM invitation_send_logs WHERE invite_url IS NULL;`로 확인.

```sql
ALTER TABLE invitation_send_logs ALTER COLUMN invite_url SET NOT NULL;
```

> 이 경우 `drizzle/schema/invitations.ts`의 `inviteUrl: text('invite_url')` → `inviteUrl: text('invite_url').notNull()`으로 함께 수정.

### [0-B] `link_event_type` enum + `invitation_link_events` 테이블 생성

Drizzle 정상 처리. 생성된 SQL 검토 후 실행.

> 사전 확인: `drizzle/migrations/` 에 `0003_unusual_ultron.sql` 파일이 `_journal.json`에 등록되지 않은 채 존재함.
> `db:generate`는 스냅샷(`meta/0006_snapshot.json`) 기준으로 diff를 생성하므로 직접적인 영향은 없으나,
> `db:migrate` 실행 전 journal 기준으로만 실행됨을 확인. (고아 파일은 자동 실행되지 않음 ✓)

---

## 1. 스키마 / 열거형 수정

### `drizzle/schema/enums.ts`
- [ ] `sendStatusEnum` 정의 제거
- [ ] `linkEventTypeEnum` 추가
  ```typescript
  export const linkEventTypeEnum = pgEnum('link_event_type', [
    'opened',
    'login_converted',
    'joined',
  ]);
  ```

### `drizzle/schema/invitations.ts`
- [ ] import에서 `sendStatusEnum` 제거, `linkEventTypeEnum` 추가 (`sendStatusEnum`을 import 목록에서 제거하지 않으면 TypeScript 컴파일 에러)
- [ ] `invitationSendLogs`에서 `status` 컬럼 제거
- [ ] `invitationLinkEvents` 테이블 추가
  ```typescript
  export const invitationLinkEvents = pgTable('invitation_link_events', {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    logId: text('log_id')
      .notNull()
      .references(() => invitationSendLogs.id, { onDelete: 'cascade' }),
    eventType: linkEventTypeEnum('event_type').notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }, (t) => [
    index('idx_link_events_log_id').on(t.logId),
    index('idx_link_events_type').on(t.eventType),
  ]);
  ```
  > `updated_at` 없음 — `drizzle/CLAUDE.md` "모든 테이블에 created_at, updated_at" 규칙의 의도적 예외.
  > 이벤트 로그는 INSERT-only 불변 레코드이므로 `updated_at`이 무의미. `invitationSendLogs`도 동일 패턴.
- [ ] `InvitationLinkEvent` 타입 export 추가
  ```typescript
  export type InvitationLinkEvent = typeof invitationLinkEvents.$inferSelect;
  ```

### `drizzle/schema/index.ts`
- [ ] `invitations.ts`가 `export *`로 포함되어 있으므로 자동 export 확인만

### `drizzle/schema/relations.ts`
- [ ] `invitationLinkEvents` import 추가
- [ ] `invitationSendLogsRelations` 새로 추가
- [ ] `invitationLinkEventsRelations` 새로 추가
  ```typescript
  export const invitationSendLogsRelations = relations(invitationSendLogs, ({ one, many }) => ({
    invitation: one(invitations, { fields: [invitationSendLogs.invitationId], references: [invitations.id] }),
    sender: one(users, { fields: [invitationSendLogs.senderId], references: [users.id] }),
    linkEvents: many(invitationLinkEvents),
  }));

  export const invitationLinkEventsRelations = relations(invitationLinkEvents, ({ one }) => ({
    log: one(invitationSendLogs, { fields: [invitationLinkEvents.logId], references: [invitationSendLogs.id] }),
    user: one(users, { fields: [invitationLinkEvents.userId], references: [users.id] }),
  }));
  ```

---

## 2. 공통 인프라

### `src/common/constants/error-codes.ts`
- [ ] 신규 에러 코드 없음 (§12) — 수정 불필요

---

## 3. DTO

### `src/send-logs/dto/create-send-log.dto.ts` (신규)
- [ ] `channel` 필드만 포함
  ```typescript
  import { z } from 'zod';

  export const CreateSendLogSchema = z.object({
    channel: z.enum(['link', 'kakao', 'sms', 'email', 'dm']),
  });
  export type CreateSendLogDto = z.infer<typeof CreateSendLogSchema>;
  ```

---

## 4. Repository

### `src/send-logs/send-logs.repository.ts` (신규)

| 메서드 | 설명 |
|--------|------|
| `findAllByInvitation(invitationId)` | `createdAt DESC` 정렬. id, channel, inviteUrl, createdAt 반환 |
| `create(data)` | invitationId, senderId, channel, inviteUrl (ref 없이) INSERT |
| `findInvitationMeta(invitationId)` | title, description, mainImageKey 조회 (kakao 메타용) |

> `inviteUrl` 컬럼은 DB 스키마상 nullable (`text('invite_url')`)이므로 Drizzle 반환 타입이 `string | null`.
> Repository에서 `findAllByInvitation` 결과를 Service로 넘길 때 `inviteUrl`이 null인 row에 `?ref=` 추가 시 런타임 오류 발생 가능.
> Service에서 null 체크 후 안전하게 처리: `const url = log.inviteUrl ?? baseUrl; return url + '?ref=' + log.id;`

### `src/send-logs/link-events.repository.ts` (신규)

| 메서드 | 설명 |
|--------|------|
| `createEvent(data)` | logId, eventType, userId? INSERT |

---

## 5. Service

### `src/send-logs/send-logs.service.ts` (신규)

| 메서드 | 핵심 로직 |
|--------|-----------|
| `findAll(invitationId)` | sendLogsRepository.findAllByInvitation |
| `create(userId, invitationId, dto)` | ① inviteUrl 생성 (`https://wara.com/invite/{invitationId}`) / ② sendLogsRepository.create / ③ channel별 메타 분기 / ④ 응답 inviteUrl에 `?ref={logId}` 추가 |
| `recordOpen(logId)` | linkEventsRepository.createEvent({ logId, eventType: 'opened' }) — userId 항상 null |

> `create` 채널별 메타 분기:
> - `kakao` → `findInvitationMeta()` 조회, null이면 503. `kakaoMeta: { title, description, imageUrl }` 추가 (`imageUrl`은 `mainImageKey`에 CDN baseUrl 조합 — 팀 CDN URL 형식 확인 후 구현)
> - `sms` → `smsUri: "sms:?body=${encodeURIComponent(message)}"` 생성
> - `link | email | dm` → 공통 필드만

---

## 6. Controller

### `src/send-logs/send-logs.controller.ts` (신규)

| 엔드포인트 | Guards | 비고 |
|-----------|--------|------|
| `GET /invitations/:invitationId/logs` | `@UseGuards(HostGuard)` + `@RequireMemberRole(MemberRole.HOST)` | JwtAuthGuard는 전역 APP_GUARD — 명시 불필요. 200 |
| `POST /invitations/:invitationId/logs` | `@UseGuards(HostGuard)` + `@RequireMemberRole(MemberRole.HOST, MemberRole.GUEST)` | ZodValidationPipe(CreateSendLogSchema). 201 |
| `PATCH /invitations/:invitationId/logs/:logId/open` | `@Public()` | `@HttpCode(204)`. userId 항상 null |

> POST /logs에 `HostGuard + @RequireMemberRole(MemberRole.HOST, MemberRole.GUEST)` 사용.
> HostGuard의 `requiredRoles.includes(memberRole)` 로직이 HOST·GUEST 모두 처리하므로 별도 ParticipantGuard 불필요.
> JwtAuthGuard는 AuthModule에서 `APP_GUARD`로 전역 등록되어 있으므로 Controller에서 `@UseGuards(JwtAuthGuard)` 명시 불필요 (locations.controller.ts 패턴 참고).

---

## 7. Module 설정

### `src/send-logs/send-logs.module.ts` (신규)
- [ ] providers: `SendLogsService`, `SendLogsRepository`, `LinkEventsRepository`
- [ ] imports: `AuthModule` (HostGuard, ParticipantRepository DI 해결. DatabaseModule은 @Global()이므로 불필요)
- [ ] controllers: `SendLogsController`

### `src/app.module.ts` (수정)
- [ ] `SendLogsModule` imports 배열에 추가

---

## 8. 문서 동기화

### `docs/conventions/error-codes.md`
- [ ] 신규 에러 코드 없음 — 수정 불필요

### `docs/api/api.md`
- [ ] 3개 엔드포인트 명세 추가
  - `GET /invitations/:invitationId/logs`
  - `POST /invitations/:invitationId/logs`
  - `PATCH /invitations/:invitationId/logs/:logId/open`

---

## 구현 순서 요약

```
0-A. 스키마에서 status 컬럼·sendStatusEnum 제거, inviteUrl .notNull() 변경 → db:generate → SQL 검토(DROP TYPE + ALTER COLUMN NOT NULL 포함 확인) → db:migrate
0-B. linkEventTypeEnum·invitationLinkEvents 스키마 추가 → db:generate → SQL 검토 → db:migrate
1.   InvitationLinkEvent 타입 export 확인
2.   DTO 작성
4.   Repository 구현 (send-logs.repository → link-events.repository)
5.   Service 구현
6.   Controller 구현
7.   Module 설정 + app.module.ts 등록
8.   문서 동기화 (api.md)
9.   pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

> **`login_converted` 추가 시 (V1.1+)**
> - enum에 이미 존재하므로 migration 불필요
> - `PATCH /logs/:logId/login-converted` (JwtAuthGuard) 엔드포인트 추가
> - Service에 `recordLoginConverted(logId, userId)` 추가
> - 프론트 로그인 완료 후 `?ref={logId}` 유지 필요 (프론트 협의 선행)
