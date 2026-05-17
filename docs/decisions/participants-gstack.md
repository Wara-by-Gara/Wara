# Participants 도메인 — gstack

> mettPocock 설계 기반 구현 체크리스트.
> 위에서 아래로 순서대로 진행 (의존성 순서).

---

## 0. 사전 작업 — DB 마이그레이션

### [0-A] `cancelled` enum 삭제 (수동 SQL)
```sql
ALTER TYPE rsvp_status RENAME TO rsvp_status_old;
CREATE TYPE rsvp_status AS ENUM ('attending', 'undecided', 'absent');
UPDATE participants SET rsvp_status = 'absent' WHERE rsvp_status = 'cancelled';
ALTER TABLE participants
  ALTER COLUMN rsvp_status TYPE rsvp_status
  USING rsvp_status::text::rsvp_status;
DROP TYPE rsvp_status_old;
```

### [0-B] `is_hidden` 컬럼 추가
```sql
ALTER TABLE "participants" ADD COLUMN "is_hidden" boolean NOT NULL DEFAULT false;
```

---

## 1. 스키마 / 열거형 수정

### `drizzle/schema/enums.ts`
- [ ] `rsvpStatusEnum` 배열에서 `'cancelled'` 제거

### `drizzle/schema/invitations.ts`
- [ ] `participants` 테이블에 `isHidden` 컬럼 추가
  ```typescript
  isHidden: boolean('is_hidden').notNull().default(false),
  ```

### `src/common/enums/rsvp-status.enum.ts`
- [ ] `CANCELLED = 'cancelled'` 멤버 삭제

---

## 2. 공통 인프라

### `src/common/constants/error-codes.ts`
- [ ] 5개 에러 코드 추가
  ```typescript
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',       // 404
  PARTICIPANT_ALREADY_EXISTS: 'PARTICIPANT_ALREADY_EXISTS', // 409
  HOST_CANNOT_LEAVE: 'HOST_CANNOT_LEAVE',               // 400
  INVITATION_CLOSED: 'INVITATION_CLOSED',               // 422
  RSVP_PERMISSION_DENIED: 'RSVP_PERMISSION_DENIED',     // 403
  ```

### `src/common/types/express.d.ts`
- [ ] `participant?: Participant` 타입 추가
  ```typescript
  import type { Participant } from '../../../drizzle/schema';
  // Request 인터페이스에 participant?: Participant 추가
  ```

### `src/common/repositories/participant.repository.ts` (수정)
- [ ] `findByUserAndInvitation(userId, invitationId)` 메서드 추가
  - ParticipantGuard에서 `request.participant` 주입용으로 사용

### `src/common/guards/participant.guard.ts` (신규)
- [ ] `ParticipantRepository.findByUserAndInvitation(userId, invitationId)` 호출
- [ ] 결과 없으면 `ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED)` throw
- [ ] `request.participant`에 결과 주입

### `src/common/guards/rsvp-status.guard.ts` (신규)
- [ ] `Reflector`로 `@RequireRsvpStatus` 메타데이터 읽기
- [ ] 메타데이터 없으면 통과
- [ ] `request.participant.rsvpStatus`가 허용 목록에 없으면 `ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED)`
- [ ] HOST(`memberRole === 'HOST'`)는 rsvpStatus 무관하게 통과

### `src/common/decorators/require-rsvp-status.decorator.ts` (신규)
- [ ] `@RequireRsvpStatus(...statuses: RsvpStatus[])` 데코레이터 구현
  ```typescript
  export const RSVP_STATUS_KEY = 'rsvpStatus';
  export const RequireRsvpStatus = (...statuses: RsvpStatus[]) =>
    SetMetadata(RSVP_STATUS_KEY, statuses);
  ```

### `src/auth/auth.module.ts` (수정)
- [ ] `ParticipantGuard`, `RsvpStatusGuard` providers 추가
- [ ] `ParticipantGuard`, `RsvpStatusGuard` exports 추가

---

## 3. DTO 수정

### `src/participants/dto/join-invitation.dto.ts`
- [ ] `rsvpStatus` 필드 추가 (optional, default `'undecided'`)
  ```typescript
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']).optional().default('undecided'),
  ```

### `src/participants/dto/update-rsvp.dto.ts`
- [ ] `z.enum`에서 `'cancelled'` 제거 → `['attending', 'undecided', 'absent']`

### `src/participants_example/dto/update-rsvp.dto.ts`
- [ ] 동일하게 `'cancelled'` 제거

### `src/participants/dto/update-hidden.dto.ts` (신규)
- [ ] 파일 생성
  ```typescript
  export const UpdateHiddenSchema = z.object({ isHidden: z.boolean() });
  export type UpdateHiddenDto = z.infer<typeof UpdateHiddenSchema>;
  ```

---

## 4. Repository

### `src/participants/participants.repository.ts`

| 메서드 | 설명 |
|--------|------|
| `findAllByInvitation(invitationId)` | participants + users JOIN, 전체 조회 (필터 없음 — summary 계산용) |
| `findById(id)` | 단건 조회 (participants row만) |
| `findByIdWithUser(id)` | participants + users JOIN 단건 조회 — getProfile용 |
| `findByUserAndInvitation(userId, invitationId)` | POST join 중복 참가 체크 전용 |
| `findInvitationStatus(invitationId)` | invitations 테이블 직접 조회 → `'active' \| 'closed' \| null` |
| `getMutualParticipants(myUserId, targetUserId)` | 두 유저가 함께 참가한 초대장의 공통 참여자 |
| `getSharedInvitations(myUserId, targetUserId, excludeInvitationId)` | 함께 참여한 다른 초대장 목록 |
| `create(data)` | `memberRole: 'GUEST'` 고정, rsvpStatus 포함 |
| `updateRsvpStatus(id, rsvpStatus)` | rsvpStatus + updatedAt 업데이트 |
| `updateHidden(id, isHidden)` | isHidden + updatedAt 업데이트 |
| `hardDelete(id)` | participants row 삭제 |

---

## 5. Service

> **Guard 적용 엔드포인트는 Controller가 `request.participant`를 꺼내 Service에 전달.**
> Service는 DB를 다시 조회하지 않음.

### `src/participants/participants.service.ts`

| 메서드 | 핵심 로직 |
|--------|-----------|
| `findAll(invitationId, viewer, filter?)` | ① findAllByInvitation 전체 조회 / ② 전체 결과로 summary 계산 / ③ participants 배열에서 absent 항상 제외 / ④ filter 있으면 추가 필터 후 반환 |
| `getProfile(invitationId, participantId, viewer)` | ① findByIdWithUser → 404 / ② result.invitationId !== invitationId → 404 / ③ 반환 |
| `getMutual(invitationId, participantId, viewer)` | ① findById(participantId) → 404 / ② target.invitationId !== invitationId → 404 / ③ getMutualParticipants(viewer.userId, target.userId) |
| `getSharedInvitations(invitationId, participantId, viewer)` | ① findById(participantId) → 404 / ② target.invitationId !== invitationId → 404 / ③ getSharedInvitations(viewer.userId, target.userId, invitationId) |
| `join(userId, invitationId, dto)` | ① findByUserAndInvitation → 중복 409 / ② findInvitationStatus → null 404 / closed 422 / ③ create |
| `updateRsvp(invitationId, participantId, dto, viewer)` | ① viewer.id !== participantId → 403 / ② findInvitationStatus → null 404 / closed 422 / ③ updateRsvpStatus |
| `updateHidden(isHidden, viewer)` | ① updateHidden(viewer.id, isHidden) |
| `leave(participantId, viewer)` | ① findById → 404 / ② target.invitationId !== viewer.invitationId → 404 / ③ target.memberRole === 'HOST' → 400 / ④ viewer.id !== participantId AND viewer.memberRole !== 'HOST' → 403 / ⑤ hardDelete |

> GET 엔드포인트의 rsvpStatus 체크는 RsvpStatusGuard가 담당. Service에서 중복 체크 불필요.

---

## 6. Controller

### `src/participants/participants.controller.ts`

| 엔드포인트 | Guards | 비고 |
|-----------|--------|------|
| `GET /invitations/:invitationId/participants` | JwtAuthGuard, ParticipantGuard, RsvpStatusGuard + `@RequireRsvpStatus('attending','undecided')` | `?rsvpStatus` query 옵션. `request.participant` → viewer로 Service 전달 |
| `GET /invitations/:invitationId/participants/:participantId/profile` | JwtAuthGuard, ParticipantGuard, RsvpStatusGuard + `@RequireRsvpStatus('attending','undecided')` | `request.participant` → viewer로 Service 전달 |
| `GET /invitations/:invitationId/participants/:participantId/mutual` | JwtAuthGuard, ParticipantGuard, RsvpStatusGuard + `@RequireRsvpStatus('attending','undecided')` | `request.participant` → viewer로 Service 전달 |
| `GET /invitations/:invitationId/participants/:participantId/shared-invitations` | JwtAuthGuard, ParticipantGuard, RsvpStatusGuard + `@RequireRsvpStatus('attending','undecided')` | `request.participant` → viewer로 Service 전달 |
| `POST /invitations/:invitationId/participants` | JwtAuthGuard | ZodValidationPipe(JoinInvitationSchema). ParticipantGuard 없음 |
| `PATCH /invitations/:invitationId/participants/:participantId/rsvp` | JwtAuthGuard, ParticipantGuard | ZodValidationPipe(UpdateRsvpSchema). `request.participant` → viewer로 Service 전달. `viewer.id !== participantId` → 403 |
| `PATCH /invitations/:invitationId/participants/me/hidden` | JwtAuthGuard, ParticipantGuard | ZodValidationPipe(UpdateHiddenSchema). `request.participant` → viewer로 Service 전달 |
| `DELETE /invitations/:invitationId/participants/:participantId` | JwtAuthGuard, ParticipantGuard | @HttpCode(204). `request.participant` → viewer로 Service 전달. HOST 체크는 Service |

### `src/participants/participants.module.ts`
- [ ] `AuthModule` imports 추가 — `ParticipantGuard`, `RsvpStatusGuard` DI 해결용
- [ ] `ParticipantsRepository` providers 추가

### `src/participants/participants.controller.ts`
- [ ] `@Controller('invitations/:invitationId/participants')` 경로 확인 (현재 stub은 `'participants'`로 잘못 등록됨)

---

## 7. 문서 동기화

### `docs/conventions/error-codes.md`
- [ ] `## Participants` 섹션 추가 (에러 코드 5개)

### `docs/api.md`
- [ ] 8개 엔드포인트 명세 추가

---

## 구현 순서 요약

```
0. DB 마이그레이션 실행
1. 스키마/열거형 수정
2. 공통 인프라 (error-codes → express.d.ts → guards → decorator)
3. DTO 수정
4. Repository 구현
5. Service 구현
6. Controller 구현
7. Module 업데이트
8. 문서 동기화
9. pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
