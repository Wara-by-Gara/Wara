# k6 부하 테스트 입문 가이드

> 처음 k6를 만지는 백엔드 개발자를 위한 교재.
> WARA 프로젝트 예시를 사용하지만, 다른 NestJS/Node 프로젝트에도 그대로 적용 가능하다.

---

## 0. 시작하기 전에

### 부하 테스트가 뭐고, 왜 하는가

> "지금 서버가 100명까지는 버틸까? 1000명이면 터질까? 어디서 먼저 무너질까?"

이 질문에 답하려면 **실제로 트래픽을 만들어서 때려봐야 한다**. 부하 테스트는 가상의 사용자를 만들어 서버에 요청을 쏟아붓고, 응답 시간/실패율/처리량을 측정하는 작업이다.

테스트 종류는 강도와 길이에 따라 4가지로 나뉜다.

| 이름 | 목적 | 강도 | 시간 |
|---|---|---|---|
| **Smoke** | 스크립트 잘 도는지 확인 | VU 1~2 | 1분 |
| **Load** | 평소 트래픽 시뮬레이션 | 평균 RPS 수준 | 10분~1시간 |
| **Stress** | 어디서 무너지는지 찾기 | 점점 늘림 | 30분~ |
| **Soak** | 장시간 누수 확인 | 평균 부하 | 수시간 |

오늘 우리는 주로 **Load** 테스트를 짧게 돌릴 거다.

### 왜 k6를 쓰는가

| 도구 | 언어 | 특징 |
|---|---|---|
| **k6** | JavaScript 시나리오 + Go 엔진 | 빠름, 시나리오 코드가 단순, 결과 리포트 깔끔 |
| Apache JMeter | GUI / XML | 기능 많지만 무겁고 진입장벽 |
| Artillery | YAML / JS | NestJS 친화적, 그러나 k6보다 자료가 적음 |
| wrk / hey | 단발 CLI | 엔드포인트 1개 빠르게 두드릴 때 |

k6 장점:
- 시나리오를 **평범한 JS 파일**로 작성 → 동료 리뷰 가능
- Grafana Labs 공식 도구 → 문서 풍부, 활발한 개발
- **하나의 바이너리** → 설치/배포 단순
- 출력이 사람 친화적 + JSON으로 export 가능

단점:
- WebSocket/SSE는 지원하지만 카운트가 별도
- k6 스크립트 자체는 sandboxed Node가 아님 → 일반 `require`/`fs` 못 씀 (k6 전용 모듈만 가능)

---

## 1. 설치

### Windows
```powershell
winget install GrafanaLabs.k6
```

### macOS
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6
```

### Docker (설치 없이)
```bash
docker run --rm -i grafana/k6 run - < script.js
```

설치 확인:
```bash
k6 version
# k6.exe v2.0.0 (...)
```

---

## 2. Hello, k6 — 첫 스크립트

가장 단순한 스크립트:

```javascript
// hello.js
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('https://test-api.k6.io/');
  sleep(1);
}
```

실행:
```bash
k6 run hello.js
```

기본값으로 **1 VU가 1번** 실행되고 끝난다. 결과는 이런 식:

```
data_received..................: 14 kB  20 kB/s
data_sent......................: 412 B  582 B/s
http_req_blocked...............: avg=176.46ms ...
http_req_duration..............: avg=246.81ms ...
http_reqs......................: 1      1.4/s
iteration_duration.............: avg=1.7s     ...
iterations.....................: 1      1.4/s
vus............................: 1      min=1
vus_max........................: 1      min=1
```

이게 출발점이다. 이제 부하를 늘려보자.

---

## 3. 핵심 개념 4개

### 3-1. VU (Virtual User)

**가상 사용자**. 동시에 요청을 보내는 "사람" 수. VU 50 = 동시에 50명이 서버에 접속 중이라고 시뮬레이션.

### 3-2. Iteration

VU 한 명이 `export default function`을 한 번 실행하는 것 = 1 iteration. VU는 함수를 **계속 반복 실행**한다. 1분 동안 1 VU가 매번 함수를 100번 실행했다면 → 100 iterations.

### 3-3. Scenario

부하 패턴 한 묶음. "VU 50명이 1분 동안 일정하게 두드린다" 같은 한 시나리오. 한 스크립트에 여러 시나리오를 정의할 수도 있다 (고급).

### 3-4. Threshold

테스트가 "성공"으로 간주되는 기준. 예: "p95 응답시간이 2초 미만이어야 함". 조건 안 맞으면 종료 코드 99로 끝난다 → CI/CD에서 잡아낼 수 있다.

---

## 4. options — 부하 패턴 정의

```javascript
export const options = {
  vus: 50,           // VU 50명이
  duration: '1m',    // 1분 동안 일정하게
  thresholds: {
    http_req_failed: ['rate<0.01'],          // 실패율 1% 미만
    http_req_duration: ['p(95)<2000'],       // p95 응답 < 2초
  },
};
```

이게 가장 단순한 형태. 우리 프로젝트의 모든 시나리오가 이 패턴이다.

### 단계적 부하 (ramping) — 더 현실적

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // 0 → 20 VU로 30초간 증가
    { duration: '1m',  target: 20 },   // 20 VU 유지 1분
    { duration: '30s', target: 100 },  // 20 → 100 VU 점진 증가 (stress 구간)
    { duration: '1m',  target: 100 },  // 100 VU 유지
    { duration: '30s', target: 0 },    // 0으로 ramp down
  ],
};
```

실제 트래픽은 갑자기 50명이 동시 접속하지 않는다. 단계적으로 늘렸다 줄였다 한다. stages가 그 패턴을 만든다.

### Arrival Rate — VU가 아닌 "초당 요청 수"로 직접 제어

```javascript
export const options = {
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 100,              // 초당 100 요청
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,    // VU 풀은 50명 미리 확보
    },
  },
};
```

"RPS 100 유지" 같은 목표가 명확할 때 사용. VU 기반은 sleep에 따라 RPS가 달라지지만, arrival rate는 강제 보장.

---

## 5. http 모듈 — 요청 보내기

```javascript
import http from 'k6/http';

// GET
http.get('http://localhost:3000/api/users');

// 헤더 추가
http.get(url, {
  headers: { Authorization: `Bearer ${token}` },
});

// POST + JSON body
http.post(
  'http://localhost:3000/api/login',
  JSON.stringify({ email: 'a@b.c', password: '1234' }),
  { headers: { 'Content-Type': 'application/json' } },
);

// 응답 객체
const res = http.get(url);
console.log(res.status);    // 200
console.log(res.body);      // 문자열
console.log(res.json());    // 파싱된 JSON
console.log(res.timings);   // duration, connecting, sending, ...
```

---

## 6. check — 응답 검증

```javascript
import { check } from 'k6';

const res = http.get(url);
check(res, {
  'status 200': (r) => r.status === 200,
  'has id field': (r) => r.json().id !== undefined,
  'fast enough': (r) => r.timings.duration < 500,
});
```

- check는 **요청 자체를 실패시키지 않는다** (그냥 통계에 카운트만 됨)
- threshold와 함께 쓰면 `checks: ['rate>0.95']` 같은 가드 가능

---

## 7. sleep — 사용자 행동 시뮬레이션

```javascript
import { sleep } from 'k6';

export default function () {
  http.get(url);
  sleep(0.5);    // 0.5초 대기 (다음 iteration 전)
}
```

**왜 sleep을 넣나?** 실제 사용자는 1초에 100번 클릭하지 않는다. 적당한 sleep이 더 현실적이다. 또한 sleep 없으면 VU 1명이 1초에 수백~수천 요청을 보내서 측정값이 왜곡된다.

대신: sleep이 길어지면 RPS가 낮아진다. **목표 RPS = VU / (sleep + 평균응답시간)** 가량.

---

## 8. 메트릭 읽는 법

k6 출력의 핵심 메트릭들:

```
http_req_duration..............: avg=14.96ms  min=509.2µs  med=11.56ms
                                  max=150.34ms p(90)=24.09ms p(95)=36.84ms
http_req_failed................: 0.00%  0 out of 5843
http_reqs......................: 5843   96.69/s
iteration_duration.............: avg=515.73ms
```

### http_req_duration — 응답 시간 분포

가장 중요한 지표. **요청 보낸 시점부터 응답 다 받은 시점까지** 걸린 시간.

- `avg` (평균): 대표값. 단, 이상치에 흔들림.
- `med` (중앙값 = p50): 절반은 이 시간보다 빠름. avg보다 robust.
- `min` / `max`: 극값. min은 **best case, 노이즈 다 제거된 순수 처리 시간**.
- `p(90)`, `p(95)`, `p(99)`: **상위 X% 분위수**. p95=36ms = 95%의 요청은 36ms 안에 끝났음. 5%는 그보다 더 걸림.

**왜 p95가 중요한가**: 평균은 거짓말한다. 평균 100ms인데 사용자 5%가 5초 걸리면 그건 망한 거다. p95/p99는 "사용자 경험의 꼬리"를 본다.

### http_req_failed — 실패율

`rate<0.01` 같은 threshold로 정책 설정. 4xx/5xx/네트워크 에러 모두 포함.

### http_reqs — 처리량

전체 요청 수와 **RPS (초당 요청 수)**. 부하 테스트의 핵심 산출물 중 하나.

### iteration_duration — 한 시나리오 사이클

`http_req + sleep`까지 포함. sleep을 0.5초로 두고 응답이 ~15ms면 iteration은 ~515ms. 이걸로 "1 VU가 1분에 몇 사이클을 도나" 계산 가능.

### checks_succeeded / checks_failed

`check()` 호출들의 통과율. 200이 아닌 응답 비율 등을 본다.

---

## 9. p50, p95, p99의 진짜 의미

흔히 헷갈리는 부분. 그림으로 설명:

```
응답 시간을 1000번 측정해서 빠른 순으로 줄 세웠다.
       ↓ p50           ↓ p95   ↓ p99
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
 500번째         950번째   990번째
```

- p50 = "절반은 이 시간보다 빠르다" = 일반적 사용자가 경험하는 시간
- p95 = "95%는 이 시간보다 빠르다" = 운 나쁜 5% 사용자가 경험하는 시간
- p99 = "1% 사용자가 겪는 최악의 응답시간"

대시보드에는 **p50, p95, p99를 같이** 두는 게 표준. p50과 p99 차이가 크면 = 응답 시간 편차가 큼 = GC/락/콜드캐시 등 의심.

---

## 10. SharedArray — 외부 데이터 활용

부하 테스트 시 토큰 100개를 미리 발급해두고, VU별로 랜덤 선택하는 식. k6는 sandboxed라 일반 `fs.readFile`이 안 되지만 **`open()` 빌트인**이 있다.

```javascript
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('tokens', () => {
  const data = JSON.parse(open('./seed-tokens.json'));
  return data.hosts.map((h) => h.token);
});

export default function () {
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  http.get(url, { headers: { Authorization: `Bearer ${token}` } });
}
```

`SharedArray`는 **모든 VU가 메모리를 공유**한다 (각 VU가 토큰 100개를 복사하지 않음). 큰 데이터셋(수만~수십만)을 다룰 때 필수.

`open()`은 **빌드 타임에 한 번** 파일을 읽는다. 런타임에 동적으로 못 읽음. 경로는 스크립트 파일 기준 상대경로.

---

## 11. 인증 처리 — 3가지 패턴

### 패턴 A: 미리 발급한 토큰 파일 사용 (가장 단순)

```javascript
const tokens = new SharedArray('t', () => JSON.parse(open('./tokens.json')));

export default function () {
  const t = tokens[Math.floor(Math.random() * tokens.length)];
  http.get(url, { headers: { Authorization: `Bearer ${t}` } });
}
```

장점: 인증 자체가 측정에 안 끼어든다. 토큰 풀이 충분하면 캐시 효과 등을 분산시킬 수 있다.
단점: 토큰 만료 관리, 미리 시드/발급 필요.

### 패턴 B: setup() 단계에서 1회 로그인

```javascript
export function setup() {
  const res = http.post(`${BASE}/login`, JSON.stringify({...}), {
    headers: { 'Content-Type': 'application/json' },
  });
  return { token: res.json().token };
}

export default function (data) {
  http.get(url, { headers: { Authorization: `Bearer ${data.token}` } });
}
```

setup은 **모든 VU 시작 전 1회** 실행. 거기서 받은 값은 default(data) 인자로 전달.

장점: 로그인 플로우 자체 검증 가능.
단점: 토큰 1개로 50 VU가 동시 사용 → 동일 user_id로만 부하. 사용자 다양성 시뮬레이션 불가.

### 패턴 C: 매 iteration마다 로그인

```javascript
export default function () {
  const auth = http.post(`${BASE}/login`, ...);
  const token = auth.json().token;
  http.get(url, { headers: { Authorization: `Bearer ${token}` } });
}
```

권장하지 않음. **로그인 자체가 측정에 끼어든다** → DB write, JWT 서명, 해시 비교 등이 매 요청에 추가됨. 인증을 별도 시나리오로 분리하지 않는 한 부적절.

---

## 12. 결과 저장 — `--summary-export`

```bash
k6 run --summary-export=results/before.json my-script.js
```

JSON으로 결과 떨굼:
```json
{
  "metrics": {
    "http_req_duration": {
      "values": { "avg": 14.96, "p(95)": 36.84, "min": 0.5, ... }
    },
    "http_req_failed": { "values": { "rate": 0.0, "passes": 0, "fails": 5843 } },
    ...
  }
}
```

before/after 두 JSON 비교하면 정량적 개선 보고서 만들기 좋다.

---

## 13. 환경변수로 BASE_URL 등 주입

```javascript
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const VUS = Number(__ENV.VUS) || 50;
```

실행 시:
```bash
k6 run -e BASE_URL=https://staging.example.com -e VUS=100 script.js
```

스테이징/로컬을 같은 스크립트로 돌릴 수 있다.

---

## 14. 흔한 함정 5개

### 함정 1 — 99% 실패가 갑자기 나옴
**원인**: Rate Limiter / Throttler / WAF가 IP 단위로 막음. k6는 같은 IP에서 다중 VU.
**해결**: dev 환경에서 throttler 우회 (env로 한계 크게), 또는 분산 부하 (k6 cloud).

### 함정 2 — 응답이 너무 빠른데 평균이 200ms
**원인**: 일부 요청이 5초씩 걸려서 평균이 끌어올려짐.
**해결**: `min`, `p(50)`, `p(95)`, `p(99)`를 같이 보기. avg는 결정적 지표가 아님.

### 함정 3 — `open()`이 동작 안 함
**원인**: VU의 `default function` 안에서 호출했음. open은 init 단계(파일 최상단)에서만.
**해결**:
```javascript
const data = open('./file.json');  // OK (init)
export default function () {
  const data = open('./file.json'); // X (runtime)
}
```

### 함정 4 — sleep 안 넣었더니 1 VU가 RPS 1000 찍음
**원인**: 응답이 너무 빠르면 VU가 끊임없이 반복. 실제 사용자 행동과 다름.
**해결**: 적당한 sleep (0.5~3초). 또는 arrival-rate 사용.

### 함정 5 — 인덱스 추가했는데 응답 시간 그대로
**원인**: DB 쿼리 시간이 전체 응답에서 차지하는 비중이 작음. 또는 dataset이 작아서 옵티마이저가 풀스캔을 더 선호.
**해결**: `EXPLAIN ANALYZE`로 DB 쿼리 시간 분리 측정. dataset 늘려서 풀스캔 비용 명확화.

---

## 15. 실전 — WARA 프로젝트 예시

### 시나리오 정의 표

| 시나리오 | 라우트 | 인증 | 목적 |
|---|---|---|---|
| 01 | `GET /invitations` | 호스트 토큰 | "내 초대장 목록" — invitations 풀스캔 |
| 02 | `GET /invitations/:id/participants` | 참가자 토큰 | "참가자 목록" — participants 풀스캔 |
| 03 | `GET /invitations/:id` | 공개 (토큰 X) | baseline (PK 조회) |

### 시드 토큰 발급

`apps/api/drizzle/seed/index.ts`에 토큰 발급 블록 추가:

```typescript
const hosts = SEEDS.users.filter((u) => u.email?.startsWith('host')).slice(0, 50);
const issue = (userId, role) =>
  sign({ id: userId, role, scope: [] }, secret, { expiresIn: '7d' });

writeFileSync(out, JSON.stringify({
  hosts: hosts.map((u) => ({
    id: u.id,
    token: issue(u.id, u.role),
    invitationIds: invitationIdsByUser.get(u.id) ?? [],
  })),
}, null, 2));
```

`pnpm db:seed` 끝나면 `drizzle/seed/seed-tokens.json` 생성. **반드시 `.gitignore`에 추가** (JWT 시크릿 포함).

### k6 스크립트 (02번 예시)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const targets = new SharedArray('targets', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  const pairs = [];
  for (const h of data.hosts) {
    for (const invId of h.invitationIds) pairs.push({ token: h.token, invId });
  }
  return pairs;
});

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001/api';

export default function () {
  const t = targets[Math.floor(Math.random() * targets.length)];
  const res = http.get(`${BASE}/invitations/${t.invId}/participants`, {
    headers: { Authorization: `Bearer ${t.token}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.5);
}
```

### 실행 사이클

```powershell
# 1. baseline 측정 (인덱스 추가 전)
k6 run --summary-export=results/02-before.json 02-participants-list.js

# 2. 인덱스 추가 (schema 변경 → migrate)
pnpm -F api db:generate
pnpm -F api db:migrate

# 3. 재측정
k6 run --summary-export=results/02-after.json 02-participants-list.js

# 4. EXPLAIN ANALYZE로 DB 쿼리 시간 분리 확인
docker exec wara_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "EXPLAIN ANALYZE SELECT * FROM participants WHERE invitation_id = '...';"
```

---

## 16. 더 공부할 거리

### k6 공식 문서
- https://grafana.com/docs/k6/latest/

### 개념별 학습 순서 추천
1. options + http + check (기본)
2. SharedArray + open (데이터)
3. Trend / Counter / Rate (커스텀 메트릭)
4. setup / teardown (라이프사이클)
5. scenarios (다중 시나리오)
6. xk6 extensions (gRPC, Kafka 등)

### Grafana 연동 (대시보드)
부하 테스트 결과를 시계열로 보고 싶다면:
- k6 → InfluxDB → Grafana 파이프라인
- 또는 k6 Cloud (유료)

### 부하 테스트 사고방식
- "병목은 항상 가장 약한 한 곳"
- "측정 없이 추측하지 말 것" (인덱스 추가가 항상 답은 아님)
- "min/p50/p95/p99를 모두 봐야 진짜 모습이 보임"
- "재현 가능한 환경 (같은 dataset, 같은 부하 패턴, 같은 시간대)이 핵심"

---

## 17. 한 페이지 요약

```javascript
// 1. import
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 2. init (한 번만 실행, fs 가능)
const data = new SharedArray('d', () => JSON.parse(open('./file.json')));

// 3. options (부하 패턴)
export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

// 4. setup (모든 VU 시작 전 1회)
export function setup() {
  return { token: 'abc' };
}

// 5. default — VU가 반복 실행 (= iteration)
export default function (ctx) {
  const item = data[Math.floor(Math.random() * data.length)];
  const res = http.get(`https://api.example.com/items/${item.id}`, {
    headers: { Authorization: `Bearer ${ctx.token}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

// 6. teardown (모든 VU 끝난 후 1회)
export function teardown(ctx) {
  // 후처리
}
```

실행:
```bash
k6 run --summary-export=results.json script.js
```

이게 전부다. 나머지는 디테일과 시나리오 다양화일 뿐.
