---
name: db-review
description: >
  Use this skill to perform a thorough DB review: transactions, concurrency/locking,
  index coverage, N+1 queries, migration safety.
  Triggers include: DB 점검, 인덱스 확인, N+1 쿼리, 트랜잭션 검토, 락/동시성, DB 최적화, 마이그레이션 검토.
  Always verify findings with actual query/schema code before flagging.
---

# DB Review Skill (NestJS / Drizzle ORM / WARA)

쿼리 성능과 데이터 정합성 두 축에서 코드를 분석한다.
추측성 지적 없이, 실제 쿼리 코드로 증명된 문제만 보고한다.

---

## 원칙

- Schema 정의 → Migration SQL → Repository 쿼리 → Service 호출부 순서로 추적
- 인덱스 존재 여부는 schema 파일과 migration SQL 양쪽 모두 확인
- N+1은 루프 안에서 `await repo.find*()` 패턴을 탐색해 증명
- 트랜잭션 범위는 atomic해야 하는 단위(check-then-act, 복수 테이블 write)를 기준으로 판단

---

## Workflow

### Phase 1 — 인덱스 커버리지 스캔

```bash
grep -rn "index(\|uniqueIndex(" apps/api/src/database/schema/
grep -n "\.where\|eq(\|and(\|gte(\|lte(" apps/api/src/**/*.repository.ts
```

**체크 항목:**

| 패턴 | 확인 방법 |
|------|-----------|
| FK 컬럼 인덱스 | `references()` 컬럼에 `index()` 정의 여부 |
| 복합 필터 | WHERE 두 컬럼 동시 사용 시 복합 인덱스 필요 |
| soft delete 필터 | `deleted_at IS NULL` 조합 컬럼 복합 인덱스 |
| 정렬 컬럼 | `orderBy(desc(t.createdAt))` 패턴 인덱스 여부 |
| unique constraint | 중복 방지 규칙에 `uniqueIndex()` 존재 여부 |

---

### Phase 2 — N+1 쿼리 탐색

```bash
grep -n "for\|\.map\|forEach" apps/api/src/**/*.service.ts
```

각 루프 내부 `await repo.*()` 호출 확인:
- 루프 × DB hit → `inArray` / `with` 관계 쿼리로 대체 가능한지 판단

---

### Phase 3 — 트랜잭션 범위 검증

```bash
grep -rn "db.transaction\|\.transaction(" apps/api/src/**/*.repository.ts
```

**원자성이 필요한 패턴:**

| 패턴 | 위험 | 해결 |
|------|------|------|
| check-then-act | findById → create 사이 race | DB unique constraint + 트랜잭션 |
| 복수 테이블 write | A 성공 + B 실패 → 불일치 | 단일 트랜잭션 |
| 토큰 rotation | revoke + insert 분리 | 트랜잭션 or upsert |
| soft delete + 후속 처리 | delete 후 토큰/관련 데이터 처리 누락 | Promise.all or 트랜잭션 |

---

### Phase 4 — 마이그레이션 안전성

```bash
cat apps/api/drizzle/migrations/*.sql
```

**체크 항목:**

| 항목 | 기준 |
|------|------|
| NOT NULL 컬럼 추가 | 기존 데이터 있는 테이블에 DEFAULT 없으면 위험 |
| 인덱스 이름 중복 | 두 마이그레이션에 같은 이름 인덱스 존재 여부 |
| Schema ↔ Migration 일치 | schema.ts 정의와 SQL이 동일한지 |
| Cascade 설정 | `ON DELETE CASCADE` 의도와 비즈니스 규칙 일치 |

---

### Phase 5 — 집계 쿼리 최적화

```bash
grep -n "\.length\|rows\.length" apps/api/src/**/*.repository.ts
```

| 안티패턴 | 올바른 방향 |
|----------|-------------|
| `select().where(); return rows.length` | `select({ total: count() })` |
| `findAll().then(r => r.filter())` | DB WHERE 조건으로 필터 |
| 페이지네이션 없는 전체 조회 | cursor 기반 또는 limit 지정 |

---

## 출력 형식

```
## DB 점검 결과

### 발견된 문제
| # | 심각도 | 유형 | 설명 | 파일 |

### 수정 완료
| # | 문제 | 수정 내용 | 검증 |

### 양호 (수정 불필요)
| 항목 | 근거 |
```
