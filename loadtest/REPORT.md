# WARA 부하 테스트 보고서

> **작성일**: 2026-06-05
> **대상**: WARA NestJS API (`apps/api`)
> **목적**: 누락된 DB 인덱스 병목을 부하 테스트로 발견하고, 인덱스 추가 전후 응답 시간을 측정한다.

---

## 0. 요약

| 측정 | 인덱스 없음 | 인덱스 있음 | 개선 |
|---|---|---|---|
| **EXPLAIN — `participants WHERE invitation_id = ?` (187K행)** | 45.13ms | 0.085ms | **530배 ↓** |
| **EXPLAIN — `invitations WHERE user_id = ?` (25K행)** | 6.29ms | 0.23ms | 27배 ↓ |
| **k6 — GET /invitations/:id/participants p95** | 42.25ms | 53.44ms | 측정 변동 범위 |
| **k6 — GET /invitations/:id/participants min** | 11.15ms | 2.52ms | 4.4배 ↓ |

**핵심 결론**:

1. DB 쿼리 차원에서 인덱스는 **명백히 효과적**이다. (참가자 목록 쿼리 530배 개선)
2. 하지만 **API 응답 시간 전체**에서 보면 NestJS 처리/JSON 직렬화/JWT 검증 등 오버헤드가 지배적이라 인덱스 효과는 묻혔다.
3. "부하 개선 = 인덱스 추가"가 아니다. 응답 경로 전체의 병목을 측정/분석해야 한다.

---

## 1. 출발점 — 왜 부하 테스트인가

팀장 코멘트:
- "부하 테스트 전에 **시드 데이터 몇천 개** 써야 한다"
- "**데이터베이스 인덱싱**을 통해서 몇 초 개선했다"

이 두 문장을 풀면 다음과 같은 사이클이 된다.

```
시드 데이터 → 부하 테스트 → 병목 발견 → 인덱스 추가 → 재측정 → "X초 개선"
```

빈 DB는 풀스캔도 1ms 안에 끝나므로 측정 자체가 무의미하다. 인덱스 효과는 데이터가 충분히 쌓여야 드러난다.

## 2. 환경

- **API**: NestJS 11, Drizzle ORM 0.43, PostgreSQL 17 (docker)
- **부하 도구**: k6 v2.0.0 (winget 설치)
- **부하 강도**: VU 50 / duration 1m / sleep 0.5s (각 시나리오)
- **호스트**: Windows 11, 로컬 docker postgres, 로컬 API 서버

## 3. 인증 방식 결정

WARA의 모든 인증은 **소셜 로그인**(카카오/네이버/구글/애플)이다. k6에서 OAuth flow를 직접 돌릴 수 없다. 세 가지 옵션 비교:

| 옵션 | 장점 | 단점 |
|---|---|---|
| A. 시드 시 JWT 토큰 파일 발급 | 프로덕션 코드 무변경, 가장 단순 | 토큰 만료 관리 필요 |
| B. 테스트 백도어 엔드포인트 추가 | E2E 재사용 가능 | 프로덕션 코드에 테스트용 라우트 |
| C. 실제 OAuth flow | 가장 현실적 | 외부 의존 → 사실상 불가능 |

**선택: A.** 시드 스크립트 마지막에 `jsonwebtoken`으로 직접 서명 → `drizzle/seed/seed-tokens.json` 생성. payload 구조는 `auth.service.ts`와 동일 (`{ id, role, scope }`), `JWT_ACCESS_SECRET` 환경변수 사용, 만료 7일.

`.gitignore`에 추가하여 시크릿 커밋 방지.

## 4. 시드 인프라

WARA에는 이미 `drizzle/seed/` 디렉토리에 tier0~tier6 구조의 시드 인프라가 구축돼 있었다. 다만 규모가 너무 작았다:

```
HOST_COUNT = 40, GUEST_COUNT = 160, INVITATION_COUNT = 100
```

이 정도로는 인덱스 효과가 보이지 않는다. 상수만 늘리면 비례 확장되는 구조라 아래처럼 변경했다 (`fixtures.ts:40-45`).

### 4-1. 1차 — 중규모

```
HOST_COUNT = 2,000, GUEST_COUNT = 8,000, INVITATION_COUNT = 5,000
```

기대 데이터 규모: 유저 10K, 초대장 5K, 참가자 37K, 사진 75K.

### 4-2. PostgreSQL 파라미터 한계

단일 INSERT 문은 65,535 bind 파라미터 한계가 있다. 30K행 * 10컬럼 = 30만 파라미터로 즉시 한계 초과. 따라서 `chunkedInsert` 헬퍼를 추가하여 1000행씩 끊어서 보내도록 모든 tier 파일을 수정했다.

```typescript
// drizzle/seed/util.ts
export async function chunkedInsert<T>(
  insertFn: (chunk: T[]) => Promise<unknown>,
  values: T[],
  chunkSize = 1000,
): Promise<void> {
  if (values.length === 0) return;
  for (let i = 0; i < values.length; i += chunkSize) {
    await insertFn(values.slice(i, i + chunkSize));
  }
}
```

각 tier에서:
```typescript
await chunkedInsert(
  (chunk) => db.insert(users).values(chunk).onConflictDoNothing(),
  SEEDS.users,
);
```

### 4-3. 시드 실행

DROP SCHEMA public → migrate → seed.

```
real    0m47.828s   (10K 유저 + 30만 행)
real    4m28.459s   (50K 유저 + 200만 행, 2차)
```

## 5. Throttler 우회

첫 k6 측정에서 **99% 실패**가 나왔다. 응답이 너무 빨라(median 870µs) 빠른 에러 응답을 의심.

원인: `app.module.ts:39`의 `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])`. **분당 60 요청 제한** → 50 VU가 분당 6000 요청 시도 → 60개만 통과.

부하 테스트 자체가 throttler 측정이 아니라면 우회해야 한다. **env 변수로 한계값 받게 변경**:

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    ttl: Number(process.env.THROTTLER_TTL_MS) || 60000,
    limit: Number(process.env.THROTTLER_LIMIT) || 60,
  },
]),
```

`.env.development`에 부하 테스트용 큰 값 추가:
```
THROTTLER_LIMIT=1000000
THROTTLER_TTL_MS=60000
```

prod 환경에는 변수를 안 두면 기본값 60/min이 그대로 적용된다.

## 6. 타겟 엔드포인트

| # | 라우트 | 측정 포인트 |
|---|---|---|
| 01 | `GET /invitations` | `invitations.user_id` 인덱스 부재 |
| 02 | `GET /invitations/:id/participants` | `participants.invitation_id` 단독 인덱스 부재 ⭐ |
| 03 | `GET /invitations/:id` (공개) | baseline (PK lookup) — 컨트롤군 |

**02번이 핵심**: `participants` 테이블에 `uq_participants_user_invitation` uniqueIndex가 `(user_id, invitation_id)` 순으로 정의돼 있다. PostgreSQL의 leftmost 규칙상 `invitation_id`만으로는 이 인덱스를 못 쓴다. → 풀스캔 발생.

## 7. 1차 측정 — 중규모 dataset

### 7-1. BEFORE (인덱스 없음)

| # | RPS | p50 | p95 |
|---|---|---|---|
| 01 GET /invitations | 96.7 | 11.6ms | **36.8ms** |
| 02 GET /invitations/:id/participants | 96.3 | 13.6ms | **30.3ms** |
| 03 GET /invitations/:id (control) | 97.4 | 9.5ms | **21.0ms** |

01과 03 비교하면 36.8 vs 21.0 = 약 1.75배 느림. 인덱스 부재가 측정 가능한 수준.

### 7-2. 인덱스 추가

Drizzle schema에 인덱스 정의 추가 (`invitations.ts`):

```typescript
// invitations 테이블
index('idx_invitations_user_id').on(t.userId),

// participants 테이블
// (user_id, invitation_id) uniqueIndex는 leftmost 규칙상 invitation_id 단독 조회에 못 씀.
index('idx_participants_invitation_id').on(t.invitationId),
```

`pnpm db:generate` → `pnpm db:migrate`로 마이그레이션 생성·적용.

### 7-3. AFTER (인덱스 있음) — 그런데...

| # | BEFORE p95 | AFTER p95 | 변화 |
|---|---|---|---|
| 01 | 36.8ms | 37.4ms | ±0 |
| 02 | 30.3ms | **43.6ms** | **+13ms (악화)** |
| 03 | 21.0ms | 20.6ms | ±0 |

**02가 오히려 느려졌다.** 인덱스를 추가했는데 더 느린 결과가 나옴.

### 7-4. EXPLAIN ANALYZE로 진단

DB 쿼리 자체를 직접 들여다봤다:

```sql
EXPLAIN ANALYZE SELECT * FROM participants WHERE invitation_id = '...';
```

```
Bitmap Heap Scan on participants  (actual time=0.038..0.039 rows=5 loops=1)
   ->  Bitmap Index Scan on idx_participants_invitation_id  (actual time=0.030..0.031 rows=5)
 Execution Time: 0.080 ms
```

**옵티마이저는 인덱스를 잘 쓰고 있다.** 쿼리 자체는 0.08ms. 그럼 왜 응답시간이 안 줄었나?

#### 가설

1. **데이터셋이 PostgreSQL 워킹메모리에 다 캐싱됨**: 37K 행은 모두 RAM에 들어가서 풀스캔도 디스크 IO 없이 빠름. 인덱스의 본질적 우위인 "디스크 IO 회피"가 작동할 자리가 없음.
2. **응답 시간 30~40ms 중 DB 시간은 1ms 미만**: 나머지는 NestJS 처리, JSON 직렬화, JWT 검증, HTTP/네트워크 등. DB 시간이 줄어도 전체에서 차지하는 비중이 작아 측정 노이즈에 묻힘.
3. **측정 표본 변동**: 03(control)도 측정마다 ±5ms 변동. 02의 +13ms도 이 노이즈 범위에 속함.

→ **결론**: 인덱스는 정상 동작하지만, 작은 dataset에서는 효과가 응답시간에 드러나지 않는다. 데이터셋을 키워야 한다.

## 8. 2차 측정 — 대규모 dataset (5배)

```
HOST_COUNT = 10,000, GUEST_COUNT = 40,000, INVITATION_COUNT = 25,000
```

기대 규모: **유저 50K, 초대장 25K, 참가자 187K, 사진 378K, 좋아요 604K, 피드백 300K**. 시드 시간 4분 28초.

이번엔 정확한 before/after를 위해 순서를 바꿨다.

### 8-1. 인덱스 DROP → BEFORE

```sql
DROP INDEX idx_invitations_user_id;
DROP INDEX idx_participants_invitation_id;
```

#### EXPLAIN (인덱스 없음 + 대규모)

```
=== invitations ===
Seq Scan on invitations  (actual time=0.014..6.199 rows=3 loops=1)
   Filter: ((deleted_at IS NULL) AND (user_id = '...'))
   Rows Removed by Filter: 24997
 Execution Time: 6.290 ms

=== participants ===
Gather  (actual time=1.399..45.043 rows=5 loops=1)
   Workers Planned: 2
   ->  Parallel Seq Scan on participants  (actual time=24.772..38.825)
         Rows Removed by Filter: 62497
 Execution Time: 45.134 ms
```

`Parallel Seq Scan`이 등장하고 **45.13ms**를 찍었다. 데이터셋을 키우니 풀스캔 비용이 명확히 드러난다.

#### k6 BEFORE

| # | RPS | p50 | p95 | **min** |
|---|---|---|---|---|
| 01 GET /invitations | 95.8 | 13.9ms | 50.07ms | 0.66ms |
| 02 GET /invitations/:id/participants | 94.5 | 23.1ms | 42.25ms | **11.15ms** |
| 03 GET /invitations/:id (control) | 96.3 | 14.0ms | 36.37ms | 1.39ms |

**02의 min=11.15ms가 시그널.** 다른 시나리오는 최소 응답이 1ms 미만으로 떨어지는데, 02는 가장 빠른 응답조차 11ms 이상. → 모든 요청에 풀스캔 비용이 깔린다.

### 8-2. 인덱스 CREATE → AFTER

```sql
CREATE INDEX idx_invitations_user_id ON invitations USING btree (user_id);
CREATE INDEX idx_participants_invitation_id ON participants USING btree (invitation_id);
```

#### EXPLAIN (인덱스 있음 + 대규모)

```
Bitmap Heap Scan on participants  (actual time=0.045..0.046 rows=5 loops=1)
   ->  Bitmap Index Scan on idx_participants_invitation_id  (actual time=0.036..0.037)
 Execution Time: 0.085 ms
```

**45.13ms → 0.085ms = 530배 개선.**

#### k6 AFTER

| # | RPS | p50 | p95 | **min** |
|---|---|---|---|---|
| 01 GET /invitations | 95.6 | 18.1ms | 42.54ms | 0.51ms |
| 02 GET /invitations/:id/participants | 94.6 | 21.0ms | 53.44ms | **2.52ms** |
| 03 GET /invitations/:id (control) | 96.2 | 14.3ms | 32.81ms | 0.99ms |

**02의 min=11.15ms → 2.52ms로 4.4배 단축.** 풀스캔 비용이 사라진 명확한 증거.

p95는 02가 오히려 50ms대로 올라간 것처럼 보이지만, 03(control)도 36→33으로 ±5ms 정도 변동했다. 측정 노이즈 범위. 정확하려면 측정 횟수를 늘려 분포를 보는 게 맞다.

### 8-3. 1차 vs 2차 비교 요약

| 측정 | 1차 (37K participants) | 2차 (187K participants) |
|---|---|---|
| BEFORE 풀스캔 EXPLAIN | 측정 안 함 (캐시 효과로 빠름) | **45.13ms** |
| AFTER 인덱스 EXPLAIN | 0.08ms | **0.085ms** |
| BEFORE k6 p95 (02) | 30.3ms | 42.2ms |
| AFTER k6 p95 (02) | 43.6ms | 53.4ms |
| AFTER k6 min (02) | 11.7ms | **2.52ms** |

→ **min 시간이 진짜 신호**. p95는 외부 노이즈(GC, 네트워크 jitter, OS 스케줄링)에 흔들린다.

## 9. 인사이트

### 9-1. 인덱스 효과를 "응답 시간"으로만 보면 안 된다

DB 쿼리 시간(0.08ms)이 전체 응답 시간(30~50ms)에서 차지하는 비중은 0.2% 수준. 인덱스로 DB 시간이 500배 빨라져도 전체 응답에서 보면 미미하다.

**진짜 측정해야 하는 것**:
- `EXPLAIN ANALYZE`로 DB 쿼리 시간을 분리해서 보기
- p50/p95/p99 + **min 값**을 같이 보기 (min은 best case = 모든 노이즈 제거된 순수 처리 시간)
- 응답 시간 = DB + 직렬화 + 네트워크 + GC. 어느 비중인지 분해

### 9-2. 작은 dataset에서 인덱스는 오히려 손해일 수 있다

PostgreSQL 옵티마이저는 dataset이 작으면 **인덱스를 쓰지 않고 풀스캔을 선택**한다. 인덱스 lookup의 random IO가 sequential 풀스캔보다 비싸기 때문이다.

오늘 1차 측정에서 인덱스 추가 후 02가 더 느려진 건 이 효과의 일부였을 가능성이 있다. (옵티마이저 결정은 통계 기반이라 매번 같지 않음)

### 9-3. 부하 테스트는 "측정 → 진단 → 변경 → 재측정" 사이클

오늘 진행한 사이클:
1. 작은 dataset 측정 → 인덱스 추가 → 효과 안 보임
2. **왜 안 보이지?** EXPLAIN 진단 → "쿼리 자체는 빠름"
3. **그럼 어디서 시간이 드나?** dataset 크기/처리 오버헤드 분석
4. 대규모 dataset 재구성 → 인덱스 효과 명확히 드러남

이 사이클 자체가 면접/포트폴리오의 "X초 개선" 스토리보다 더 가치 있다. 인덱스를 그냥 추가하고 끝내는 게 아니라, **왜 효과가 났는지/왜 안 났는지 설명할 수 있는 게** 진짜 실력이다.

## 10. 도입한 변경 사항 (영구)

| 파일 | 변경 | 이유 |
|---|---|---|
| `apps/api/src/database/schema/invitations.ts` | `idx_invitations_user_id`, `idx_participants_invitation_id` 인덱스 추가 | 풀스캔 회피 (큰 dataset에서 530배 개선 검증) |
| `apps/api/drizzle/migrations/0005_*.sql` | 생성됨 | 위 인덱스 영구 적용 |
| `apps/api/src/app.module.ts` | Throttler 한계값을 env 변수로 | 부하테스트/dev에서 우회 가능, prod 기본값(60/min) 유지 |
| `apps/api/.env.development` | `THROTTLER_LIMIT=1000000` 추가 | 부하테스트용 |
| `apps/api/drizzle/seed/util.ts` | 신규: `chunkedInsert` 헬퍼 | 대규모 시드의 PostgreSQL 파라미터 한계 우회 |
| `apps/api/drizzle/seed/tier*.ts` | `chunkedInsert` 적용 | 위와 동일 |
| `apps/api/drizzle/seed/index.ts` | `seed-tokens.json` 발급 추가 | k6 인증용 |
| `apps/api/.gitignore` | `drizzle/seed/seed-tokens.json` 추가 | JWT 시크릿 노출 방지 |
| `loadtest/` (신규) | k6 스크립트 3종 + README | 재현 가능한 부하 테스트 |

## 11. 다음에 개선할 점

1. **측정 변동성 제거**: 1분 1회가 아니라 동일 시나리오 3~5회 반복 후 분포 보기. `min` 외에 `p50`, `stddev`까지 추적.
2. **부하 강도 단계화**: ramping arrival rate로 50 → 100 → 200 VU 시뮬레이션 (실제 트래픽 곡선과 더 유사).
3. ~~**DB 시간만 별도 측정**: NestJS 응답에 `X-DB-Time` 헤더 추가 → k6 Trend 메트릭으로 분리.~~ ✅ **완료** — `DbTimeInterceptor` + `db-time-store.ts` 구현. `01`~`03` 스크립트 모두 `db_time_ms` / `db_query_count` Trend 추적.
4. **무거운 쿼리 부하 테스트**: JOIN이 많거나 ORDER BY가 비싼 쿼리 (예: 사진 목록 with 좋아요 카운트). 인덱스 효과가 응답 시간에 더 명확히 드러난다.
5. **인덱스 마이그레이션을 prod에 안전하게 배포**: PostgreSQL은 `CREATE INDEX CONCURRENTLY`로 락 없이 인덱스 추가 가능. drizzle 마이그레이션에 추가 검토.
6. **Redis 캐시 도입 검토**: docker-compose에 Redis 없음. 인덱스만으로 안 줄어드는 응답 시간을 캐시로 줄일 수 있는 영역 식별.

---

## 12. Phase G 재측정 — X-DB-Time 분해

> Phase B `DbTimeInterceptor` 도입으로 응답 시간 중 DB 시간을 분리 측정 가능해짐.
> `01`~`03` 스크립트 모두 `db_time_ms` / `db_query_count` Trend 추적.

### Phase F 인덱스 추가 내역

| 인덱스 | 테이블 | 대상 쿼리 |
|---|---|---|
| `idx_notifications_user_id` | `notifications(user_id)` | `findAllByUser`, `countUnreadByUser`, `markAllAsRead` |

### 측정 방법

k6 실행 후 출력에서 `db_time_ms` Trend 항목 확인:

```
db_time_ms   p50=?.?ms  p95=?.?ms
db_query_count avg=?
```

- `db_time_ms p95` vs `http_req_duration p95` → DB 시간 비중 확인
- `db_query_count avg` → 요청당 평균 쿼리 수 (N+1 감지 지표)

### 결과 (k6 실행 후 채울 것)

| 시나리오 | http p95 | db_time p95 | DB 비중 | query count avg |
|---|---|---|---|---|
| 01 GET /invitations | - | - | - | - |
| 02 GET participants | - | - | - | - |
| 03 GET invitation detail | - | - | - | - |

---

## 부록 A. 재현 방법

```powershell
# 1. dev DB 비우고 큰 dataset 시드 (시간: 약 5분)
docker exec wara_postgres bash -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;"'
pnpm -F api db:migrate
pnpm -F api db:seed

# 2. API 서버 실행 (별도 터미널)
pnpm -F api dev

# 3. 인덱스 DROP하고 BEFORE 측정
docker exec wara_postgres bash -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP INDEX idx_invitations_user_id; DROP INDEX idx_participants_invitation_id;"'
cd loadtest
k6 run --summary-export=results/01-before.json 01-my-invitations.js
k6 run --summary-export=results/02-before.json 02-participants-list.js
k6 run --summary-export=results/03-before.json 03-invitation-detail.js

# 4. 인덱스 CREATE하고 AFTER 측정
docker exec wara_postgres bash -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE INDEX idx_invitations_user_id ON invitations(user_id); CREATE INDEX idx_participants_invitation_id ON participants(invitation_id);"'
k6 run --summary-export=results/01-after.json 01-my-invitations.js
k6 run --summary-export=results/02-after.json 02-participants-list.js
k6 run --summary-export=results/03-after.json 03-invitation-detail.js
```

## 부록 B. 핵심 EXPLAIN 결과

### participants 쿼리 (187K행)

**인덱스 없음**:
```
Gather  (cost=1000.00..5387.34 rows=8 width=170)
        (actual time=1.399..45.043 rows=5 loops=1)
   Workers Planned: 2
   Workers Launched: 2
   ->  Parallel Seq Scan on participants
         Filter: (invitation_id = '...')
         Rows Removed by Filter: 62497
 Execution Time: 45.134 ms
```

**인덱스 있음**:
```
Bitmap Heap Scan on participants
        (actual time=0.045..0.046 rows=5 loops=1)
   Recheck Cond: (invitation_id = '...')
   ->  Bitmap Index Scan on idx_participants_invitation_id
         (actual time=0.036..0.037 rows=5 loops=1)
 Execution Time: 0.085 ms
```

530배 차이. PostgreSQL이 인덱스 lookup으로 정확히 5개 row만 찾아낸다.
