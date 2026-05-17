# Send Logs 도메인 — Gstack

> mettPocock 설계 기반 구현 체크리스트.
> 위에서 아래로 순서대로 진행 (의존성 순서).

---

## 0. DB 마이그레이션

스키마 수정 → `pnpm db:generate` → SQL 검토 → `pnpm db:migrate` 순서로 진행.
두 마이그레이션은 별도 파일로 분리.

### [0-A] `status` 컬럼 제거 + `send_status` 타입 삭제

Drizzle이 enum DROP TYPE을 누락할 수 있으므로 생성된 SQL에 아래 구문 포함 여부 확인 후 없으면 수동 추가.

```sql
ALTER TABLE invitation_send_logs DROP COLUMN status;
DROP TYPE send_status;
```

### [0-B] `link_event_type` enum + `invitation_link_events` 테이블 생성

Drizzle 정상 처리. 생성된 SQL 검토 후 실행.

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
- [ ] import에서 `sendStatusEnum` 제거, `linkEventTypeEnum` 추가
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
- [ ] `InvitationLinkEvent` 타입 export 추가
  ```typescript
  export type InvitationLinkEvent = typeof invitationLinkEvents.$inferSelect;
  ```

### `drizzle/schema/index.ts`
- [ ] `invitations.ts`가 `export *`로 포함되어 있으므로 자동 export 확인만

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
> - `kakao` → `findInvitationMeta()` 조회, null이면 503. `kakaoMeta: { title, description, imageUrl }` 추가
> - `sms` → `smsUri: "sms:?body=${encodeURIComponent(message)}"` 생성
> - `link | email | dm` → 공통 필드만

---

## 6. Controller

### `src/send-logs/send-logs.controller.ts` (신규)

| 엔드포인트 | Guards | 비고 |
|-----------|--------|------|
| `GET /invitations/:invitationId/logs` | JwtAuthGuard, HostGuard + `@MemberRole(HOST)` | 200 |
| `POST /invitations/:invitationId/logs` | JwtAuthGuard, HostGuard + `@MemberRole(HOST, GUEST)` | ZodValidationPipe(CreateSendLogSchema). 201 |
| `PATCH /invitations/:invitationId/logs/:logId/open` | `@Public()` | `@HttpCode(204)`. userId 항상 null |

> POST /logs에 `HostGuard + @MemberRole(HOST, GUEST)` 사용.
> HostGuard의 `requiredRoles.includes(memberRole)` 로직이 HOST·GUEST 모두 처리하므로 별도 ParticipantGuard 불필요.

---

## 7. Module 설정

### `src/send-logs/send-logs.module.ts` (신규)
- [ ] providers: `SendLogsService`, `SendLogsRepository`, `LinkEventsRepository`
- [ ] imports: `DatabaseModule`, `AuthModule` (JwtStrategy DI 해결)
- [ ] controllers: `SendLogsController`

### `src/app.module.ts` (수정)
- [ ] `SendLogsModule` imports 배열에 추가

---

## 8. 문서 동기화

### `docs/conventions/error-codes.md`
- [ ] 신규 에러 코드 없음 — 수정 불필요

### `docs/api/api.md`
- [ ] 4개 엔드포인트 명세 추가
  - `GET /invitations/:invitationId/logs`
  - `POST /invitations/:invitationId/logs`
  - `PATCH /invitations/:invitationId/logs/:logId/open`

---

## 구현 순서 요약

```
0-A. 스키마에서 status 컬럼·sendStatusEnum 제거 → db:generate → SQL 검토(DROP TYPE 포함 확인) → db:migrate
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
