# WARA DB 설계 최종 체크리스트

> 새 테이블/쿼리 구현 완료 후 PR 올리기 전 확인.
> ✅ 통과 / ❌ 미통과 / N/A 해당없음

---

## 1. 인덱스

- [ ] 모든 FK 컬럼에 `index()`가 정의됐는가?
- [ ] 두 컬럼을 동시에 WHERE로 쓰는 쿼리에 복합 인덱스가 있는가?
- [ ] `deleted_at IS NULL`과 함께 필터링하는 컬럼에 복합 인덱스가 있는가?
- [ ] `ORDER BY created_at DESC` 패턴에 인덱스가 있는가?
- [ ] 중복 방지 비즈니스 규칙에 `uniqueIndex()`가 있는가?
- [ ] Schema 파일의 인덱스 정의가 Migration SQL에 그대로 반영됐는가?

---

## 2. N+1 쿼리

- [ ] 루프(for / map) 안에서 Repository 메서드를 반복 호출하지 않는가?
- [ ] 복수 ID 조회는 `inArray()`로 단일 쿼리로 처리하는가?
- [ ] 관계 데이터 조회는 `with()` 또는 JOIN으로 처리하는가?
- [ ] `Promise.all`로 병렬화가 가능한 독립 쿼리는 묶었는가?

---

## 3. 트랜잭션 / 원자성

- [ ] check-then-act 패턴(조회 후 생성)에 DB unique constraint가 있는가?
- [ ] 두 개 이상의 테이블을 동시에 write하는 경우 트랜잭션으로 묶였는가?
- [ ] Refresh token rotation (revoke + insert)이 원자적으로 처리되는가?
- [ ] 계정 삭제 / soft delete 시 관련 데이터(토큰 등) 처리가 같은 트랜잭션 또는 Promise.all인가?

---

## 4. 마이그레이션 안전성

- [ ] 기존 데이터 있는 테이블에 NOT NULL 컬럼 추가 시 DEFAULT 값이 있는가?
- [ ] 인덱스 이름이 마이그레이션 파일 전체에서 유일한가?
- [ ] Migration SQL과 Drizzle schema 정의가 일치하는가?
- [ ] `ON DELETE CASCADE` 설정이 비즈니스 규칙과 일치하는가?
- [ ] 마이그레이션 실패 시 롤백 가능한 구조인가?

---

## 5. 집계 / 페이지네이션

- [ ] 카운트 조회가 전체 row 로드 후 `.length`가 아닌 SQL `COUNT()`를 사용하는가?
- [ ] 목록 조회에 cursor 기반 페이지네이션 또는 limit이 적용됐는가?
- [ ] 애플리케이션 레이어 필터링 없이 DB WHERE로 데이터를 걸러내는가?

---

## 6. 동시성 / 락

- [ ] 재고/카운터 성격의 컬럼 업데이트가 read-then-write 패턴이 아닌 SQL increment인가?
  > `SET count = count + 1` vs `findById → update(count + 1)`
- [ ] 동시 참가 요청에 대해 DB unique constraint가 race condition을 막는가?
- [ ] Optimistic/Pessimistic lock이 필요한 자원에 적용됐는가?

---

## 현재 브랜치 적용 현황 (feat/db-optimization 기준)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| invitations FK 인덱스 (user_id) | ✅ | idx_invitations_user_id |
| invitations soft delete 복합 인덱스 | ✅ | idx_invitations_user_deleted |
| participants FK 인덱스 (invitation_id) | ✅ | idx_participants_invitation_id |
| participants 복합 인덱스 (rsvp+role) | ✅ | idx_participants_invitation_rsvp_role |
| missions FK 인덱스 (invitation_id) | ✅ | idx_missions_invitation_id |
| mission_assignments 복합 unique | ✅ | uq_mission_assignments_mission_participant |
| mission_assignments FK 인덱스 (participant_id) | ✅ | idx_mission_assignments_participant_id |
| photo_likes FK 인덱스 (participant_id) | ✅ | idx_photo_likes_participant_id |
| feedbacks 인덱스 3종 | ✅ | invitation_id / photo_id / participant_id |
| notifications 인덱스 2종 | ✅ | user_id / user_id+is_read |
| send_logs FK 인덱스 | ✅ | idx_send_logs_invitation_id |
| countGuests N+1 → COUNT() | ✅ | invitations.repository.ts |
| photos.viewCount increment 동시성 | ✅ | `sql\`${photos.viewCount}+1\`` — DB 레벨 atomic increment |
| 트랜잭션 누락 여부 | ✅ | like toggle, createInvitation 모두 db.transaction 적용 확인 |
