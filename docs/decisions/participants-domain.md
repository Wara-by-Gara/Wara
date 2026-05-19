# Participants 도메인 설계

> mettPocock 설계 단계 산출물.
> gstack → superpowers 순서로 구현 진행.

---

## 1. 엔드포인트 계약

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| GET | `/invitations/:invitationId/participants` | ✅ | 목록 + summary. 기본: attending/undecided만. `?rsvpStatus=absent` 필터로 absent 조회 가능 |
| GET | `/invitations/:invitationId/participants/:participantId/profile` | ✅ | 참여자 프로필 상세 |
| GET | `/invitations/:invitationId/participants/:participantId/mutual` | ✅ | 함께 아는 사람 |
| GET | `/invitations/:invitationId/participants/:participantId/shared-invitations` | ✅ | 함께 참여한 모임 |
| POST | `/invitations/:invitationId/participants` | ✅ | 참가 등록. closed 불가. 동시에 rsvpStatus 선택 가능 |
| PATCH | `/invitations/:invitationId/participants/:participantId/rsvp` | ✅ | RSVP 변경. 본인만. attending/undecided/absent만 허용 |
| PATCH | `/invitations/:invitationId/participants/me/hidden` | ✅ | 내 초대장 목록에서 숨기기 토글. 본인만 |
| DELETE | `/invitations/:invitationId/participants/:participantId` | ✅ | 탈퇴. 본인 또는 HOST. HOST 본인 불가 |

---

## 2. 레이어 구조 및 타입 계약

### Controller → Service

> Guard 적용 엔드포인트는 `request.participant`를 `viewer`로 넘김. Service는 DB 재조회 없음.

```typescript
findAll(invitationId: string, viewer: Participant, filter?: RsvpStatus): Promise<ParticipantListResult>
getProfile(invitationId: string, participantId: string, viewer: Participant): Promise<ParticipantProfile>
getMutual(invitationId: string, participantId: string, viewer: Participant): Promise<MutualResult>
getSharedInvitations(invitationId: string, participantId: string, viewer: Participant): Promise<SharedInvitationsResult>
join(userId: string, invitationId: string, dto: JoinInvitationDto): Promise<Participant>
updateRsvp(invitationId: string, participantId: string, dto: UpdateRsvpDto, viewer: Participant): Promise<Participant>
updateHidden(isHidden: boolean, viewer: Participant): Promise<void>
leave(participantId: string, viewer: Participant): Promise<void>
```

### Service → Repository

```typescript
findAllByInvitation(invitationId: string): Promise<ParticipantWithUser[]>
findById(id: string): Promise<Participant | null>
findByIdWithUser(id: string): Promise<ParticipantWithUser | null>
findByUserAndInvitation(userId: string, invitationId: string): Promise<Participant | null>
findInvitationStatus(invitationId: string): Promise<'active' | 'closed' | null>
getMutualParticipants(myUserId: string, targetUserId: string): Promise<MutualParticipant[]>
getSharedInvitations(myUserId: string, targetUserId: string, excludeInvitationId: string): Promise<SharedInvitation[]>
create(data: { userId: string; invitationId: string; memberRole: 'HOST' | 'GUEST'; rsvpStatus: RsvpStatus }): Promise<Participant>
updateRsvpStatus(id: string, rsvpStatus: RsvpStatus): Promise<Participant>
updateHidden(id: string, isHidden: boolean): Promise<void>
hardDelete(id: string): Promise<void>
```

### 응답 타입

**GET /participants**
```typescript
{
  summary: {
    totalCount: number
    attendingCount: number
    undecidedCount: number
    absentCount: number
  }
  participants: Array<{
    id: string
    userId: string
    nickname: string | null
    profileImageUrl: string | null
    memberRole: 'HOST' | 'GUEST'
    rsvpStatus: 'attending' | 'undecided' | 'absent'
    createdAt: string
  }>
}
```

**GET /participants/:pid/mutual**
```typescript
{
  mutualParticipants: Array<{ userId: string; nickname: string | null; profileImageUrl: string | null }>
  mutualCount: number
}
```

**GET /participants/:pid/shared-invitations**
```typescript
{
  data: Array<{ invitationId: string; title: string; eventStartAt: string | null; status: 'active' | 'closed' }>
}
```

---

## 3. 스키마 변경사항

### [A] `cancelled` enum 값 삭제

`rsvpStatusEnum`에서 `cancelled` 제거 → `['attending', 'undecided', 'absent']`

> PostgreSQL은 enum 값을 직접 삭제할 수 없으므로 수동 SQL 마이그레이션 필요:
> ```sql
> ALTER TYPE rsvp_status RENAME TO rsvp_status_old;
> CREATE TYPE rsvp_status AS ENUM ('attending', 'undecided', 'absent');
> UPDATE participants SET rsvp_status = 'absent' WHERE rsvp_status = 'cancelled';
> ALTER TABLE participants
>   ALTER COLUMN rsvp_status TYPE rsvp_status
>   USING rsvp_status::text::rsvp_status;
> DROP TYPE rsvp_status_old;
> ```

**cascade 수정 파일:**
- `drizzle/schema/enums.ts` — `rsvpStatusEnum` 배열에서 `'cancelled'` 제거
- `src/common/enums/rsvp-status.enum.ts` — `CANCELLED` 멤버 삭제
- `src/participants/dto/update-rsvp.dto.ts`
- `src/participants_example/dto/update-rsvp.dto.ts`

### [B] `isHidden` 컬럼 추가

```typescript
// drizzle/schema/invitations.ts — participants 테이블
isHidden: boolean('is_hidden').notNull().default(false),
```

마이그레이션: Drizzle generate → SQL 검토 → 수동 실행
```sql
ALTER TABLE "participants" ADD COLUMN "is_hidden" boolean NOT NULL DEFAULT false;
```

**cross-domain 주의:** `GET /invitations` (내 초대장 목록) 구현 시 `participants.is_hidden = false` JOIN 필터 반드시 적용 (InvitationsModule 작업 시).

---

## 4. Guard 인프라

### 모듈 등록 전략

`ParticipantGuard`, `RsvpStatusGuard`는 `HostGuard`, `BlocklistGuard`와 동일하게 **`AuthModule`에 통합**.
도메인 모듈은 `AuthModule`을 import하는 것만으로 모든 Guard 사용 가능.

### 신규/수정 파일

| 파일 | 변경 | 역할 |
|------|------|------|
| `common/repositories/participant.repository.ts` | 수정 | `findByUserAndInvitation()` 메서드 추가 |
| `common/guards/participant.guard.ts` | 신규 | 초대장 참여자 확인 + `request.participant` 주입 |
| `common/guards/rsvp-status.guard.ts` | 신규 | `@RequireRsvpStatus` 선언 상태 검증 |
| `common/decorators/require-rsvp-status.decorator.ts` | 신규 | `@RequireRsvpStatus(...statuses)` 데코레이터 |
| `auth/auth.module.ts` | 수정 | `ParticipantGuard`, `RsvpStatusGuard` providers + exports 추가 |

`common/types/express.d.ts`에 타입 추가:
```typescript
participant?: import('../../drizzle/schema').Participant
```

### Guard 실행 순서

```
JwtAuthGuard         → 로그인 확인 (APP_GUARD 전역)
  ↓
ParticipantGuard     → 참여자 확인 + request.participant 주입
  ↓
RsvpStatusGuard      → @RequireRsvpStatus 선언 있을 때만 상태 체크
  ↓
Controller → Service → 복합 비즈니스 로직
```

### participants 도메인 적용

```typescript
// GET 엔드포인트 (목록/profile/mutual/shared-invitations)
@UseGuards(JwtAuthGuard, ParticipantGuard, RsvpStatusGuard)
@RequireRsvpStatus('attending', 'undecided')

// POST join — 미참여자 호출이므로 ParticipantGuard 없음
@UseGuards(JwtAuthGuard)

// PATCH rsvp, PATCH me/hidden, DELETE — ParticipantGuard로 viewer 주입, 소유권·HOST 체크는 Service
@UseGuards(JwtAuthGuard, ParticipantGuard)
```

---

## 5. rsvpStatus 권한 매트릭스

> HOST는 rsvpStatus와 무관하게 전체 허용 (본인 탈퇴만 불가)
> 탈퇴(DELETE) = hard delete. 탈퇴 후 row 없음. 재참여는 POST로 신규 등록.

### Participants 도메인

| 엔드포인트 | attending | undecided | absent | 탈퇴(row 없음) |
|-----------|:---------:|:---------:|:------:|:--------------:|
| GET 목록 | ✅ | ✅ | ❌ | ❌ |
| GET profile | ✅ | ✅ | ❌ | ❌ |
| GET mutual | ✅ | ✅ | ❌ | ❌ |
| GET shared-invitations | ✅ | ✅ | ❌ | ❌ |
| POST 참가 (신규/재참가) | — | — | — | ✅ |
| PATCH rsvp | ✅ | ✅ | ✅ | ❌ |
| PATCH me/hidden | ✅ | ✅ | ✅ | ❌ |
| DELETE 탈퇴 | ✅ | ✅ | ✅ | ❌ |

### 타 도메인 참고 (해당 도메인 구현 시 `@RequireRsvpStatus` 적용)

| 기능 | attending | undecided | absent |
|------|:---------:|:---------:|:------:|
| 갤러리 열람 | ✅ | ✅ | ❌ |
| 사진 업로드 | ✅ | ❌ | ❌ |
| 댓글 열람 | ✅ | ✅ | ❌ |
| 댓글 작성 | ✅ | ❌ | ❌ |
| 미션 열람 | ✅ | ✅ | ❌ |
| 미션 수행 | ✅ | ❌ | ❌ |
| GPS 공유 | ✅ | ❌ | ❌ |
| 위치 지도 열람 | ✅ | ✅ | ❌ |
| 알림 수신 | ✅ | ✅ | ❌ |

---

## 6. 비즈니스 규칙

| 작업 | 규칙 |
|------|------|
| POST join | `memberRole: 'GUEST'` 고정. 중복 409. closed 422. rsvpStatus 필수 (attending/undecided/absent 중 택 1) |
| PATCH rsvp | 본인만. HOST 불가 (항상 attending 고정). closed 422. attending/undecided/absent만 허용 (Zod에서 차단) |
| PATCH me/hidden | 본인만. closed 여부와 무관하게 토글 가능 |
| DELETE | 본인 OR HOST. HOST 본인 탈퇴 400. hard delete |
| GET (목록/profile/mutual/shared) | attending/undecided만. absent 403 |
| HOST 자동 등록 | 초대장 생성(InvitationsService) 책임 — 이 도메인 scope 밖 |
| closed 체크 | Repository에서 invitations 테이블 직접 조회 (Service↔Service 금지) |

---

## 7. 에러 코드 (신규 5개)

`common/constants/error-codes.ts` 및 `docs/conventions/error-codes.md`에 추가.

| 코드 | HTTP | 상황 |
|------|------|------|
| `PARTICIPANT_NOT_FOUND` | 404 | 참가자 조회 실패 |
| `PARTICIPANT_ALREADY_EXISTS` | 409 | 이미 참가한 초대장 |
| `HOST_CANNOT_LEAVE` | 400 | HOST 본인 탈퇴 시도 |
| `INVITATION_CLOSED` | 422 | 마감된 초대장 참가/변경 시도 |
| `RSVP_PERMISSION_DENIED` | 403 | absent 상태에서 열람 시도 |

---

## 8. 변경 파일 목록

### DB / 스키마
- `drizzle/schema/enums.ts` — `cancelled` 제거
- `drizzle/schema/invitations.ts` — `participants` 테이블에 `isHidden` 추가
- 마이그레이션 2개: cancelled enum 수동 SQL + isHidden 컬럼 Drizzle generate

### 공통 인프라 (신규/수정)
- `common/guards/participant.guard.ts` — 신규
- `common/guards/rsvp-status.guard.ts` — 신규
- `common/decorators/require-rsvp-status.decorator.ts` — 신규
- `common/repositories/participant.repository.ts` — `findByUserAndInvitation()` 추가
- `common/enums/rsvp-status.enum.ts` — `CANCELLED` 삭제
- `common/constants/error-codes.ts` — 5개 추가
- `common/types/express.d.ts` — `participant?` 타입 추가
- `auth/auth.module.ts` — `ParticipantGuard`, `RsvpStatusGuard` providers + exports 추가

### Participants 도메인
- `participants/participants.controller.ts`
- `participants/participants.service.ts`
- `participants/participants.repository.ts`
- `participants/participants.module.ts` — `AuthModule` import 추가
- `participants/dto/join-invitation.dto.ts` — optional `rsvpStatus` 추가
- `participants/dto/update-rsvp.dto.ts` — `cancelled` 제거
- `participants/dto/update-hidden.dto.ts` — 신규

### 기타
- `participants_example/dto/update-rsvp.dto.ts` — `cancelled` 제거
- `docs/conventions/error-codes.md` — 동기화
- `docs/api.md` — 신규 엔드포인트 명세 추가

---

## 9. V1.0 제외 항목

| 항목 | 이유 |
|------|------|
| `dateVotes` | CLAUDE.md 금지 (날짜 투표 = V1.1+) |
| HOST → GUEST rsvpStatus 강제 변경 | api.md "본인만" 명세 충돌 |
| `isNewUser` auth 응답 | auth/users 도메인 별도 작업 |
| `GET /invitations` isHidden 필터 | InvitationsModule 구현 시 적용 |
| `RsvpStatusGuard` 타 도메인 적용 | photos/feedbacks 도메인 작업 시 구현 |

---

## 10. 팀 논의 필요 — HOST kick + blocklist 연동

### 배경

현재 HOST가 게스트를 내보내는 흐름:
1. `DELETE /participants/:participantId` → 참가자 row 삭제 (kick)
2. `POST /blocklist` → 재참가 차단 (별도 API, 미구현)

두 단계가 분리되어 있어 kick 후 재참가가 가능한 상태.

### 논의 포인트

**Option A: 분리 유지 (현재)**
- HOST가 kick과 ban을 각각 선택 가능
- "내보내되 재참가는 허용"하는 경우를 지원
- 단점: HOST가 완전 차단하려면 두 번 액션 필요

**Option B: kick 시 자동 blocklist**
- HOST가 타인을 DELETE하면 blocklist에 자동 추가
- "내보내기 = 재참가 차단" — 더 직관적
- 본인 탈퇴는 blocklist 추가 없음 (HOST kick인 경우에만 적용)
- 구현: `ParticipantsService.leave()`에서 HOST kick 조건 시 `BlocklistRepository` 직접 호출
- 단점: participants 모듈이 blocklist 의존성 추가

### 현재 결정

**Option B 채택** — kick 시 자동 blocklist 추가.

### 구현 내용

**엔드포인트 (HOST 전용)**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/invitations/:invitationId/blocklist` | 차단 목록 조회 |
| `DELETE` | `/invitations/:invitationId/blocklist/:userId` | 차단 해제 (soft delete) |

**파일 구조**

| 파일 | 역할 |
|------|------|
| `common/repositories/blocklist.repository.ts` | `isBlocked()` (BlocklistGuard용), `add()` (cross-domain) |
| `blocklist/blocklists.repository.ts` | `findByInvitation()`, `remove()` (도메인 전용) |
| `blocklist/blocklist.service.ts` | `list()`, `unblock()` |
| `blocklist/blocklist.controller.ts` | GET / DELETE 엔드포인트 |
| `blocklist/blocklist.module.ts` | AuthModule import |

**동작 규칙**
- HOST가 `DELETE /participants/:participantId`로 kick → `invitation_blocklists`에 자동 추가 → 해당 유저 재참가 차단
- 본인 탈퇴(`viewer.id === participantId`)는 blocklist 추가 없음
- 이미 차단된 유저를 kick해도 `onConflictDoNothing`으로 무시
- 차단 해제는 `deleted_at` 설정 (soft delete)

---

## 11. 팀 논의 필요 — RSVP 변경 시간 제한

### 배경

현재 RSVP 변경 제한 조건은 `INVITATION_CLOSED` (HOST가 수동으로 마감한 상태)뿐.
시간 기반 제한이 없어 이벤트 시작 후에도 자유롭게 변경 가능.

### 현재 스키마
- `invitations.status`: `active` | `closed` (HOST 수동 마감)
- `invitations.eventStartAt`: timestamp, nullable
- `eventEndAt` 필드 없음

### 논의 포인트

| 옵션 | 설명 | 스키마 변경 | 장점 | 단점 |
|------|------|:-----------:|------|------|
| A. 제한 없음 (현재) | closed 상태에만 차단 | 없음 | 최대 유연성 | 시작 후 취소 혼란 가능 |
| B. 시작 15분 전까지 | `eventStartAt - 15min` 초과 시 차단 | 없음 | 호스트 인원 확정 도움 | 지각 참석자 RSVP 불가 |
| C. 모임 당일 자정까지 | `eventStartAt` 당일 자정(23:59:59)까지 허용 | 없음 (`eventStartAt`에서 계산) | 중간 합류 허용, 자연스러운 마감 | `eventStartAt` 없는 모임은 제한 불가 |
| D. 비대칭 (복합) | `attending→absent`는 시작 전, `absent→attending`은 당일 자정까지 | 없음 | 양방향 합리적 | 구현 복잡, 사용자 혼란 가능 |

### 현재 결정

**Option A 유지 (시간 제한 없음)** — V1.0에서는 closed 상태만 체크.

친구 모임 특성상 중간 합류가 자연스럽고, `eventEndAt` 필드 추가 없이 가능한 범위에서 시작.
이벤트 관리 고도화 시 옵션 C 또는 D 재검토 권장.

---

### 관련 개념 정리 (참고)

| 액션 | 대상 | 효과 | 되돌리기 |
|------|------|------|---------|
| absent (PATCH rsvp) | 본인 | 불참 표시, row 유지 | PATCH로 attending 전환 |
| isHidden (PATCH me/hidden) | 본인 | 내 갤러리에서만 숨김 | PATCH로 해제 |
| leave/본인 탈퇴 (DELETE) | 본인 | row 삭제, 흔적 없음 | POST로 재참가 |
| kick/강제 퇴장 (DELETE) | HOST → GUEST | row 삭제 + blocklist 자동 추가 | `DELETE /blocklist/:userId`로 차단 해제 후 재참가 가능 |
| blocklist | HOST → 특정 유저 | 링크로 재참가 차단 | `DELETE /invitations/:id/blocklist/:userId`로 HOST 해제 |
