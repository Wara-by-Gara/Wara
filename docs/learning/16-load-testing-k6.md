# 16. 부하 테스트 (k6)

> "지금 서버가 100명까지는 버틸까? 1000명이면 터질까? 어디서 먼저 무너질까?"
> WARA는 실제로 k6로 부하를 때려보고 **인덱스가 530배 차이를 만든다는 걸 측정**했다.

---

## 1. 부하 테스트 4종

| 종류 | 목적 | 강도 | 시간 |
|---|---|---|---|
| **Smoke** | 스크립트 잘 도는지 | VU 1~2 | 1분 |
| **Load** | 평소 트래픽 시뮬레이션 | 평균 RPS | 10분~1시간 |
| **Stress** | 어디서 무너지는지 | 점점 늘림 | 30분~ |
| **Soak** | 장시간 누수 확인 | 평균 | 수시간 |

WARA에서 돌린 건 주로 **Load** (1분, VU 50) — 인덱스 비교용으로 짧게 반복.

---

## 2. 왜 k6인가

| 도구 | 특징 |
|---|---|
| **k6** | JS 시나리오 + Go 엔진. 빠름, 시나리오가 단순한 JS 파일이라 리뷰 가능, 결과 깔끔 |
| JMeter | GUI/XML. 기능 많지만 무겁고 진입장벽 |
| Artillery | YAML/JS. NestJS 친화적이나 자료 부족 |
| wrk, hey | 단발 CLI. 엔드포인트 1개 빠르게 두드릴 때 |

k6 단점:
- **샌드박스 JS** — 일반 `require`/`fs` 못 씀, k6 전용 모듈만
- WebSocket·SSE는 지원하지만 메트릭이 별도

---

## 3. WARA의 부하 테스트 셋업

`loadtest/` 디렉터리:
```
loadtest/
├── README.md               # 실행 방법
├── GUIDE.md                # 처음 만지는 사람을 위한 입문서 (617줄)
├── REPORT.md               # 실제 측정 결과 보고서
├── 01-my-invitations.js    # GET /invitations (호스트 토큰)
├── 02-participants-list.js # GET /invitations/:id/participants (참가자)
├── 03-invitation-detail.js # GET /invitations/:id (공개)
└── .gitignore
```

### 측정 목표
- 누락된 DB 인덱스를 부하 테스트로 찾기
- 인덱스 추가 전후의 응답 시간 비교

---

## 4. 핵심 개념 4개

### VU (Virtual User)
가상 사용자. 동시 접속자 수.

### Iteration
VU가 `export default function`을 1번 실행 = 1 iteration. VU는 계속 반복.

### Scenario
부하 패턴 한 묶음. "VU 50명이 1분 동안 일정하게 두드린다" 같은.

### Threshold
성공 기준. 안 맞으면 종료 코드 99 → CI/CD에서 잡힘.

---

## 5. 가장 단순한 스크립트

```js
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('http://localhost:3001/api/');
  sleep(1);
}
```

```bash
k6 run hello.js
```

→ 기본값 VU 1, 1회 실행.

---

## 6. WARA 실제 스크립트 (`loadtest/01-my-invitations.js`)

```js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';

const dbTime = new Trend('db_time_ms', true);
const dbQueryCount = new Trend('db_query_count');
const dbMissingHeader = new Counter('db_header_missing');

const hostTokens = new SharedArray('hostTokens', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  return data.hosts.map((h) => h.token);
});

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],         // 실패율 1% 미만
    http_req_duration: ['p(95)<2000'],      // p95 < 2초
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

export default function () {
  const token = hostTokens[Math.floor(Math.random() * hostTokens.length)];
  const res = http.get(`${BASE_URL}/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'GET /invitations' },
  });
  check(res, { 'status 200': (r) => r.status === 200 });

  // X-DB-Time, X-DB-Query-Count는 dev 환경에서 응답 헤더로 노출 (main.ts:64)
  const dbTimeRaw = res.headers['X-Db-Time'] ?? res.headers['X-DB-Time'];
  const dbCountRaw = res.headers['X-Db-Query-Count'] ?? res.headers['X-DB-Query-Count'];
  if (dbTimeRaw !== undefined) {
    dbTime.add(parseFloat(dbTimeRaw));
    if (dbCountRaw !== undefined) dbQueryCount.add(parseInt(dbCountRaw, 10));
  } else {
    dbMissingHeader.add(1);
  }

  sleep(0.5);
}
```

### 핵심
- **`SharedArray`**: 모든 VU가 토큰 풀을 공유 (메모리 절약). 각 VU가 토큰 100개 복사 안 함
- **`open()`**: init 단계에서 1회 (default function 안에서는 호출 못 함)
- **`tags`**: 메트릭 분류용 (여러 엔드포인트 측정 시 분리)
- **`Trend`/`Counter`**: 커스텀 메트릭 — `X-DB-Time` 헤더로 백엔드 DB 시간 분리 측정

→ `X-DB-Time`은 `DbTimeInterceptor`가 dev 환경 응답에 추가하는 헤더.

---

## 7. options — 부하 패턴

### 일정 부하 (가장 단순)
```js
export const options = {
  vus: 50,
  duration: '1m',
  thresholds: { ... },
};
```

### 단계적 부하 (ramping)
```js
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // 0 → 20 VU
    { duration: '1m',  target: 20 },   // 유지
    { duration: '30s', target: 100 },  // 점진 증가
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },    // ramp down
  ],
};
```

### Arrival Rate (RPS 직접 제어)
```js
export const options = {
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 100,              // 초당 100 요청
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
    },
  },
};
```

"RPS 100 유지" 같은 목표가 명확할 때.

---

## 8. 메트릭 읽기

```
http_req_duration...: avg=14.96ms min=509.2µs med=11.56ms
                      max=150.34ms p(90)=24.09ms p(95)=36.84ms
http_req_failed.....: 0.00%  0 out of 5843
http_reqs...........: 5843   96.69/s
iteration_duration..: avg=515.73ms
```

### 가장 중요한 5개
- **`http_req_duration`**: 응답 시간 분포. 평균은 거짓말함 → **p95/p99**가 진실
- **`http_req_failed`**: 실패율 (4xx/5xx/네트워크)
- **`http_reqs`**: 처리량 + RPS
- **`iteration_duration`**: VU 1사이클 (http + sleep 포함)
- **`checks`**: `check()` 통과율

### p50 / p95 / p99 의미
```
응답 시간을 1000번 측정해 빠른 순으로 줄 세움.
       ↓ p50           ↓ p95   ↓ p99
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
 500번째         950번째   990번째
```

- **p50** = "절반은 이 시간보다 빠르다"
- **p95** = "운 나쁜 5%가 겪는 시간"
- **p99** = "1%의 최악"

대시보드엔 **p50/p95/p99 같이** 두는 게 표준. p50과 p99 차이가 크면 = GC/락/콜드캐시 의심.

---

## 9. 인증 처리 — 3가지 패턴

### A. 미리 발급한 토큰 파일 (WARA가 선택)
```js
const tokens = new SharedArray('t', () => JSON.parse(open('./tokens.json')));

export default function () {
  const t = tokens[Math.floor(Math.random() * tokens.length)];
  http.get(url, { headers: { Authorization: `Bearer ${t}` } });
}
```

장점: **인증이 측정에 안 끼어듦**. 토큰 풀이 충분하면 user별 캐시 분산.
단점: 시드 시 토큰 발급 필요, 만료 관리.

WARA는 `drizzle/seed/index.ts` 끝에서 `jsonwebtoken`으로 직접 서명 → `seed-tokens.json` 생성. `.gitignore`에 추가 (JWT 시크릿 포함).

### B. setup()에서 1회 로그인
```js
export function setup() {
  const res = http.post(`${BASE}/login`, ...);
  return { token: res.json().token };
}
export default function (data) {
  http.get(url, { headers: { Authorization: `Bearer ${data.token}` } });
}
```
단점: 토큰 1개로 50 VU → user 다양성 시뮬레이션 불가.

### C. 매 iteration마다 로그인
**비권장**. 로그인 자체가 측정에 끼어듦 (DB write, JWT 서명, 해시 비교).

---

## 10. WARA 실측 결과 (`loadtest/REPORT.md` 요약)

| 측정 | 인덱스 없음 | 인덱스 있음 | 개선 |
|---|---|---|---|
| EXPLAIN — `participants WHERE invitation_id = ?` (187K행) | **45.13ms** | **0.085ms** | **530배 ↓** |
| EXPLAIN — `invitations WHERE user_id = ?` (25K행) | 6.29ms | 0.23ms | 27배 ↓ |
| k6 — GET /invitations/:id/participants **p95** | 42.25ms | 53.44ms | **측정 변동 범위 내** |
| k6 — GET /invitations/:id/participants **min** | 11.15ms | 2.52ms | 4.4배 ↓ |

### 결론 (중요한 교훈)
1. DB 차원에서 인덱스는 **명백히 효과적** (530배)
2. 그런데 **API 전체 응답**에선 NestJS 처리·JSON 직렬화·JWT 검증 오버헤드가 지배적이라 인덱스 효과가 묻힘
3. **"부하 개선 = 인덱스 추가"가 아니다.** 응답 경로 전체의 병목을 분리 측정해야 한다.

→ `X-DB-Time` 헤더로 DB만 분리 측정한 이유가 바로 이것.

---

## 11. 실행

### k6 설치
```bash
# Windows
winget install GrafanaLabs.k6

# macOS
brew install k6

# Docker (설치 없이)
docker run --rm -i grafana/k6 run - < script.js
```

### 결과 저장 (before/after 비교용)
```bash
k6 run --summary-export=results/01-before.json 01-my-invitations.js
# ... 인덱스 추가, migrate ...
k6 run --summary-export=results/01-after.json 01-my-invitations.js
```

### 환경변수 주입
```js
const BASE = __ENV.BASE_URL || 'http://localhost:3001/api';
```
```bash
k6 run -e BASE_URL=https://staging.wara.kr/api script.js
```

---

## 12. 흔한 함정

### 99% 실패가 갑자기 나옴
**원인**: Rate Limiter/Throttler가 IP로 막음. k6는 같은 IP에서 다중 VU.
**해결**: dev에서 throttler 한계 크게 (`main.ts`에서 `process.env.NODE_ENV !== 'production' ? 10000 : 60`이 그 이유).

### 응답은 빠른데 평균이 200ms
**원인**: 일부 요청이 5초씩 걸려 평균 끌어올림.
**해결**: `min`, `p(50)`, `p(95)`, `p(99)` 같이 보기.

### `open()`이 동작 안 함
**원인**: VU의 default function 안에서 호출. init 단계(파일 최상단)에서만.

### sleep 없으면 1 VU가 RPS 1000
**원인**: 응답이 빠르면 VU가 끊임없이 반복.
**해결**: 적당한 sleep (0.5~3초) 또는 arrival-rate.

### 인덱스 추가했는데 응답시간 그대로
**원인**: DB 시간이 전체 응답의 일부분일 뿐.
**해결**: `EXPLAIN ANALYZE`로 DB만 분리. 또는 `X-DB-Time` 헤더 활용. (WARA가 정확히 이 패턴)

---

## 13. 체크리스트

- [ ] Smoke / Load / Stress / Soak 차이를 안다
- [ ] VU / Iteration / Scenario / Threshold 4개 개념을 안다
- [ ] `SharedArray` + `open()`의 init 단계 제약을 안다
- [ ] avg가 거짓말하고 p95/p99가 진실에 가깝다는 걸 안다
- [ ] "인덱스가 항상 답이 아니다" — 응답 경로 전체 측정이 필요한 이유를 안다
- [ ] WARA가 인증을 **시드 토큰 파일** 방식으로 한 이유를 안다

→ 다음: [17. Redis & BullMQ 심화](./17-redis-bullmq-deep.md)
