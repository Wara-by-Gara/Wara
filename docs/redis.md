# Redis 입문 가이드 (WARA용)

> Redis를 처음 만지는 백엔드 개발자를 위한 교재.
> WARA 프로젝트의 weather 캐시 도입 사례를 바탕으로 설명한다.

---

## 0. 시작하기 전에

### Redis가 뭐고 왜 쓰나

> "DB에 매번 같은 쿼리를 날리는 게 아깝다. 어떻게 한 번 받은 결과를 잠깐 어디 보관해뒀다가 또 쓸 수 있을까?"

**Redis = 메모리에 사는 빠른 key-value 저장소.**

- 메모리(RAM)에 데이터를 두니까 **마이크로초 단위로 응답**
- key 하나에 값(string/list/hash/set 등)을 매핑
- TTL(시간 제한)을 걸어두면 알아서 만료됨
- 여러 서버가 같은 Redis를 보면 **데이터 공유** (in-memory Map은 못 함)

### 어디에 쓰나 — 5가지 패턴

| 패턴 | 예시 |
|---|---|
| **캐시 (Cache)** | 외부 API/DB 결과를 잠시 보관 → 두 번째 호출부터 즉시 응답 |
| **세션/토큰 저장** | refresh token, OAuth state 같은 일회성 + 만료 있는 데이터 |
| **카운터** | 좋아요 수, 조회수 같이 자주 +1 되는 값 (INCR은 atomic) |
| **Rate Limit** | "분당 N회 제한" 같은 분산 카운터 |
| **큐/Pub-Sub** | 가벼운 job queue, 이벤트 브로드캐스트 |

WARA에서 처음 도입한 건 **캐시 패턴**이다 (weather).

### Redis vs 다른 옵션

| 옵션 | 장점 | 단점 | 언제 쓰나 |
|---|---|---|---|
| **in-memory Map** | 0 설치, 빠름 | 서버 재시작 시 휘발, 인스턴스 간 공유 X, 메모리 누수 위험 | 1대 서버 + 휘발 OK 데이터 |
| **Redis** | 영속화, 분산 공유, TTL, 자료 구조 풍부 | 외부 의존(컨테이너), 네트워크 latency 1~2ms | **거의 모든 캐시 시나리오** |
| **Memcached** | 정말 단순함 | string only, persistence X | Redis로 충분히 대체 가능 |
| **PostgreSQL** | 이미 있음, 트랜잭션 | 매번 디스크 IO, latency 5~50ms | 영속 필요 + 트랜잭션 |

→ **WARA에서는 Redis가 정답**. in-memory Map은 멀티 인스턴스 배포 시 깨지고, DB는 단순 캐시 용도엔 과함.

---

## 1. Redis 설치/실행

### Docker로 (권장)

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: ['redis-server', '--appendonly', 'yes']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5
```

`--appendonly yes`는 AOF(Append-Only File) 영속화 켜는 옵션. 서버 재시작해도 데이터 유지.

```powershell
docker compose up -d redis
docker exec wara_redis redis-cli ping
# PONG
```

### 직접 (선택)

- macOS: `brew install redis && brew services start redis`
- Linux: `sudo apt install redis-server`
- Windows: WSL 또는 Docker 권장 (네이티브 빌드 비공식)

---

## 2. redis-cli 기본 명령

```bash
docker exec -it wara_redis redis-cli
```

가장 자주 쓰는 것들:

```
SET foo "hello"              # key=foo, value=hello
GET foo                      # → "hello"
SET foo "hi" EX 60           # 60초 후 자동 만료
TTL foo                      # 남은 시간 (초)
DEL foo                      # 삭제
KEYS weather:*               # 패턴 매칭 (운영에서는 위험, SCAN 권장)
SCAN 0 MATCH weather:*       # 커서 기반 안전한 순회
FLUSHDB                      # 현재 DB 전체 비우기 (dev 전용)
INFO memory                  # 메모리 상태
MONITOR                      # 들어오는 모든 명령 실시간 출력 (디버그)
```

WARA 디버그 시:

```bash
docker exec wara_redis redis-cli KEYS 'weather:*'
# 1) "weather:60:126:20260605:1700"
```

---

## 3. 핵심 자료 구조 5가지

Redis는 단순 KV가 아니다. **값에 자료 구조가 있다.**

### 3-1. String — 가장 단순

```
SET counter 0
INCR counter             # 1 (atomic +1)
INCRBY counter 10        # 11
GETSET counter 0         # 11 반환 + 0으로 리셋 (atomic)
```

**용도**: 캐시 값, 카운터, 분산 락(SET NX EX).

### 3-2. Hash — 한 key 안에 필드 여러 개

```
HSET user:42 name "민성" age 27
HGET user:42 name        # "민성"
HGETALL user:42          # 전체
HINCRBY user:42 age 1    # age += 1
```

**용도**: 객체를 그대로 저장. JSON 직렬화 안 해도 필드 단위 read/write.

### 3-3. List — 양방향 큐

```
LPUSH queue "task1"
LPUSH queue "task2"
RPOP queue               # "task1" (FIFO)
LLEN queue
```

**용도**: 가벼운 job queue, 최근 N개 활동 로그.

### 3-4. Set — 중복 없는 집합

```
SADD online_users 42
SADD online_users 43
SISMEMBER online_users 42    # 1 (있음)
SCARD online_users           # 2
SINTER set_a set_b           # 교집합
```

**용도**: 온라인 유저, 태그, "내가 좋아요 누른 photo id 집합".

### 3-5. Sorted Set (ZSet) — score 정렬

```
ZADD leaderboard 100 "alice"
ZADD leaderboard 80 "bob"
ZADD leaderboard 120 "carol"
ZRANGE leaderboard 0 -1 WITHSCORES  # 점수 오름차순 전체
ZREVRANGE leaderboard 0 9            # 상위 10명
```

**용도**: 랭킹, 시간순 피드, 우선순위 큐.

---

## 4. 캐시 패턴 3가지

### 4-1. Cache-Aside (가장 흔함, WARA의 weather)

```
앱이 직접 캐시를 관리. DB는 "원본 진실".

1. 캐시에서 찾는다.
2. 있으면 그걸로 응답 (cache hit).
3. 없으면 DB/외부 API에서 가져온다.
4. 받은 값을 캐시에 저장 (TTL 같이).
5. 응답.
```

```typescript
async getWeather(key: string) {
  const cached = await cache.get(key);
  if (cached) return cached;

  const data = await kmaClient.getForecast(...);
  await cache.set(key, data, TTL);
  return data;
}
```

**장점**: 단순함. 캐시 안 써도 동작 (degrade OK).
**단점**: 데이터 변경 시 캐시 invalidation을 따로 처리해야.

### 4-2. Write-Through

```
DB write가 일어날 때 캐시도 같이 update.
```

**장점**: 캐시가 항상 최신.
**단점**: write 경로가 느려짐, 캐시-DB 일관성 보장 까다로움.

### 4-3. Write-Behind (Write-Back)

```
캐시에 먼저 write → 비동기로 DB에 반영.
```

**장점**: write 빠름.
**단점**: 캐시 죽으면 데이터 손실 가능. 카운터처럼 정확성 덜 중요한 데이터에만.

WARA는 거의 다 cache-aside면 충분하다.

---

## 5. TTL (Time To Live)

Redis의 핵심 강점. 키 별로 자동 만료 시간을 걸 수 있다.

```
SET session:abc "..." EX 3600     # 1시간 후 자동 삭제
TTL session:abc                    # 남은 시간 (초)
PERSIST session:abc                # TTL 제거 (영구)
```

**TTL 정하는 기준**:

| 데이터 | TTL |
|---|---|
| weather (3시간마다 갱신) | 3시간 |
| Kakao 장소 검색 | 30분 ~ 1일 (장소는 잘 안 변함) |
| 좋아요 카운터 | TTL 없이 + 주기 동기화 |
| refresh token | 14일 (refresh expires와 동일) |
| OAuth state | 10분 |
| 자주 변하는 read API | 30초 ~ 1분 |

→ **너무 길게 잡으면 stale, 너무 짧게 잡으면 캐시 의미 없음.** 데이터 갱신 주기 + 사용자 인내 시간을 기준으로.

---

## 6. NestJS 통합 (WARA 실제 코드)

### 6-1. 패키지 선택

NestJS 11 + cache-manager v7 시점 표준:

```json
{
  "@nestjs/cache-manager": "^3.1.2",
  "cache-manager": "^7.2.8",
  "@keyv/redis": "^5.1.6",
  "keyv": "^5.6.0"
}
```

**주의**: cache-manager v6+부터 Keyv 기반으로 완전 재설계됨. v5용 어댑터(`cache-manager-ioredis-yet` 등)와 호환 X. 새 프로젝트는 무조건 `@keyv/redis` 사용.

### 6-2. 글로벌 등록

```typescript
// apps/api/src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379')],
      }),
    }),
  ],
})
```

`isGlobal: true`로 두면 어디서든 inject 가능.

### 6-3. 서비스에서 사용

```typescript
// apps/api/src/weather/weather.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class WeatherService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getWeather(id: string) {
    const cached = await this.cache.get<KmaForecastItem[]>(cacheKey);
    if (cached) return cached;

    const fresh = await this.kmaClient.getForecast(...);
    await this.cache.set(cacheKey, fresh, CACHE_TTL_MS);
    return fresh;
  }
}
```

`cache.set`의 TTL 단위는 **밀리초**.

### 6-4. Redis 장애 대비 — Fallback 패턴

⚠️ **중요 — `@keyv/redis`는 Redis 연결 실패 시 hang할 수 있다.** Promise.race + setTimeout으로 강제 타임아웃 wrap이 필요.

```typescript
const CACHE_OP_TIMEOUT_MS = 500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

private async tryGetCache(key: string): Promise<KmaForecastItem[] | null> {
  try {
    return (await withTimeout(this.cache.get(key), CACHE_OP_TIMEOUT_MS)) ?? null;
  } catch (err) {
    this.logger.warn(`cache get 실패 (fallback): ${(err as Error).message}`);
    return null;
  }
}
```

이렇게 두면 Redis 다운 → 500ms 후 fallback → KMA 직접 호출 → 사용자는 정상 응답을 받는다.

### 6-5. 키 설계 규칙 — WARA 컨벤션

```
도메인:식별자1:식별자2:...

예시:
weather:60:126:20260605:1700      # 격자좌표 + base_time
place:keyword:hongdae:page:1       # Kakao 검색
photo:like-count:7Z9X...            # photo id
refresh:7Z9X...                     # user id
```

**원칙**:
1. `:`로 namespace 구분 → `KEYS weather:*` 같은 검색 쉬움
2. **소문자 + ASCII만** (UTF-8 key는 동작은 하지만 디버그 곤란)
3. **TTL 정책이 같은 키는 prefix 통일** → 일괄 만료 처리 용이
4. **유저 데이터는 user_id 포함** → 격리

---

## 7. Production 주의사항

### 7-1. 메모리 제한 + Eviction

Redis는 기본적으로 메모리에 다 올린다. **무제한 두면 OOM.**

```
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

| 정책 | 설명 |
|---|---|
| `noeviction` | 한도 도달 시 write 거부 (default — 사실상 못 쓰는 정책) |
| `allkeys-lru` | 가장 안 쓴 키부터 제거 (캐시 용도 추천) |
| `volatile-lru` | TTL 있는 키 중 LRU |
| `allkeys-lfu` | 가장 덜 자주 쓰는 키 (LFU) |
| `volatile-ttl` | 만료 임박 키부터 |

WARA dev/staging은 `allkeys-lru`로. **prod에서는 반드시 한도 설정.**

### 7-2. 영속화 (Persistence)

| 모드 | 특징 |
|---|---|
| **RDB** (default) | 주기적 snapshot. 빠르지만 마지막 snapshot 이후 데이터 손실 가능. |
| **AOF** | 모든 write를 append. 손실 적지만 파일 큼. |
| **둘 다** | 안전 + 복구 빠름. prod 권장. |

WARA docker-compose에 `--appendonly yes` → AOF on. **순수 캐시 용도면 영속화 꺼도 됨** (재시작 시 캐시 미스만 잠깐 발생).

### 7-3. 보안

- Redis는 **default 인증 없음**. 외부에 노출 절대 금지.
- Production: `requirepass <strong-password>` 또는 ACL.
- Redis 6+는 ACL로 user별 권한 분리 가능.
- 우리 docker-compose는 localhost 바인딩만이라 dev OK. prod 배포 시 변경 필요.

### 7-4. 분산 환경

여러 API 인스턴스 + 단일 Redis = **자동으로 공유 캐시**. 추가 설정 불필요.

스케일 더 필요하면:
- **Redis Sentinel** (HA)
- **Redis Cluster** (샤딩)
- **Managed**: AWS ElastiCache, GCP MemoryStore

WARA는 당분간 단일 인스턴스로 충분.

---

## 8. 흔한 함정 6개

### 함정 1 — Redis 다운 시 앱 전체 hang
`@keyv/redis`는 lazy connect라 첫 요청에서 hang 가능. **timeout wrap 필수**.

### 함정 2 — TTL을 까먹고 안 걸어둠
키가 무한 증가 → OOM. **모든 set에 TTL 또는 maxmemory + eviction**.

### 함정 3 — `KEYS *` 운영에서 실행
O(N)에 전체 블로킹. **SCAN으로 대체**.

### 함정 4 — JSON 직렬화 없이 객체 저장
`SET foo {a:1}` → "[object Object]" 저장됨. **`JSON.stringify`/`JSON.parse` 필수** (cache-manager는 자동).

### 함정 5 — Cache stampede
캐시 만료 직후 동시에 100명이 DB로 몰림. **분산 락(SET NX EX) + jittered TTL** 또는 **early refresh** 패턴.

### 함정 6 — 캐시-DB 불일치
write 후 캐시 invalidate 까먹음 → 사용자에게 stale 데이터. **명확한 invalidation 정책 + 짧은 TTL**.

---

## 9. WARA에 Redis 추가 적용 후보

현재(2026-06): weather만 Redis 사용. 다음 후보들:

### 🟢 A급 — 효과 명확, 도입 단순

#### A-1. Kakao Local 장소 검색 (`locations/kakao-local.service.ts`)
- **외부 API** (Kakao REST). 응답 200~500ms.
- 동일 키워드/좌표 → 동일 결과. cache hit률 매우 높음 (인기 장소 집중).
- **권장 키**: `place:keyword:{query}:page:{n}` 또는 좌표 grid 기반
- **TTL**: 1시간 ~ 1일 (장소는 잘 안 변함)
- **예상 효과**: 200~500ms → 5ms. weather와 동일 패턴 그대로 복붙 가능.

#### A-2. Refresh Token 저장 (`auth/auth.repository.ts`)
- 현재 PostgreSQL에 저장. 로그인된 유저 매 요청마다 조회 가능.
- Redis로 옮기면: **TTL 자동 만료** (만료 토큰 청소 불필요), 빠른 조회.
- **권장 키**: `refresh:{tokenHash}` → `{ userId, deviceInfo, ... }`
- **TTL**: `JWT_REFRESH_EXPIRES_IN` 그대로 (14일)
- **주의**: 보안상 중요한 데이터라 Redis 다운 시 fallback 정책 신중히. degrade보다는 503 응답이 안전할 수도.

### 🟡 B급 — 검토 필요

#### B-1. Throttler 분산 (`@nestjs/throttler-storage-redis`)
- 현재 in-memory throttler → 다중 인스턴스 시 IP별 rate limit 부정확.
- Redis storage로 교체하면 정확한 분산 카운팅.
- 단일 인스턴스 운영 중이면 지금 도입 효과 적음. **스케일 아웃 시점에 도입**.

#### B-2. 사진 좋아요/조회 카운터 (`photos.like_count` 등)
- 현재 매 like마다 `UPDATE photos SET like_count = like_count + 1`. 락 경합.
- Redis `INCR photo:like:{photoId}` + 주기적 DB sync로 전환 시 처리량 ↑
- 일관성 요구 사항이 약하다면(=실시간 정확도보다 처리량 우선) 좋은 후보.
- 단점: 캐시 손실 시 카운터 일부 사라짐 → 복구 정책 필요.

#### B-3. 초대장 상세 (`GET /invitations/:id`, 공개 라우트)
- 공유 링크 클릭 시 가장 많이 호출되는 경로.
- TTL 짧게 (30초 ~ 1분) + 호스트 수정 시 invalidate.
- 부하 테스트 결과 p95 32ms 정도라 우선순위 낮음. **트래픽 늘면 도입**.

### 🔴 C급 — 효과 적음 / 비권장

#### C-1. AI 이미지 합성 결과 (`ai/`)
- 입력 (이미지 + 프롬프트) 거의 매번 unique. cache hit률 낮음.
- 굳이 도입할 필요 없음.

#### C-2. OAuth state
- 현재 JWT (10분 만료)로 처리. Redis 불필요.
- 추가 도입 시 복잡도만 증가.

---

## 10. Cheat Sheet

```bash
# 컨테이너 진입
docker exec -it wara_redis redis-cli

# 키 검색 (운영은 SCAN)
KEYS 'weather:*'
SCAN 0 MATCH 'weather:*' COUNT 100

# TTL 확인
TTL weather:60:126:20260605:1700

# 캐시 비우기 (dev only)
FLUSHDB

# 메모리/통계
INFO memory
INFO stats

# 실시간 명령 모니터링 (디버그)
MONITOR
```

```typescript
// NestJS 코드 cheat
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

// get / set / del
const val = await this.cache.get<T>(key);
await this.cache.set(key, value, ttlMs);
await this.cache.del(key);

// 타임아웃 wrap (Redis 다운 대비)
await withTimeout(this.cache.get(key), 500);
```

---

## 11. 더 공부할 거리

- 공식 문서: https://redis.io/docs/
- 한국어 책: 「Redis 운영 관리」 (오라일리)
- 분산 락: Redlock 알고리즘
- Pub/Sub vs Streams: Streams가 더 신뢰성 있는 큐
- 모니터링: Redis Sentinel / Prometheus exporter
- 클러스터: 16384 슬롯 / 샤딩

---

## 12. 한 줄 요약

> **Redis는 "메모리에 사는 자료 구조 가진 KV"다.**
> 캐시로 시작하고, 카운터/세션/큐로 자연스럽게 확장하라.
> TTL을 잊지 말고, 다운에 대비한 fallback을 꼭 코드에 박아라.
