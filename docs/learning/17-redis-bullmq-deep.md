# 17. Redis & BullMQ 심화

> WARA의 Redis는 한 컨테이너인데 4가지 역할을 동시에 한다.

---

## 1. WARA에서 Redis가 하는 일

| 용도 | 구현 모듈 | 키 prefix |
|---|---|---|
| (1) BullMQ 잡 큐 | `apps/api/src/queues/`, `image-processing/` | `bull:...` |
| (2) 캐시 (KV) | `@nestjs/cache-manager` + `@keyv/redis` | `keyv:...` |
| (3) Refresh token 저장 | `apps/api/src/auth/auth.redis-store.ts` | (자체) |
| (4) Idempotency 락+캐시 | `apps/api/src/idempotency/` | (자체) |
| (+) Socket.IO 어댑터 | `@socket.io/redis-adapter` | (자체) |

한 Redis 인스턴스가 다 처리. 키 prefix가 충돌 안 하면 OK.

---

## 2. Redis 모듈 — 연결 3개

`apps/api/src/redis/redis.module.ts:35`:
```ts
@Global()
@Module({
  providers: [
    { provide: REDIS_CLIENT, inject: [ConfigService], useFactory: clientFactory('client') },
    { provide: REDIS_PUB,    inject: [ConfigService], useFactory: clientFactory('pub') },
    { provide: REDIS_SUB,    inject: [ConfigService], useFactory: clientFactory('sub') },
  ],
  exports: [REDIS_CLIENT, REDIS_PUB, REDIS_SUB],
})
export class RedisModule implements OnModuleDestroy {
  // ... onModuleDestroy로 graceful shutdown
}
```

### 왜 3개?
- **`REDIS_CLIENT`**: 일반 GET/SET (조회·저장)
- **`REDIS_PUB`**: 발행 (publish)
- **`REDIS_SUB`**: 구독 (subscribe)

`SUBSCRIBE` 명령은 한 연결을 **구독 모드**로 점유함 → 다른 일반 명령 못 보냄. 그래서 **별도 연결 필수**. Pub은 분리할 필요까진 없지만 명확성·디버깅 편의로 분리.

### `lazyConnect: false`, `enableReadyCheck: true`
- 부팅 시 즉시 연결 시도
- Redis가 READY 응답할 때까지 대기 (failover 중 연결 시도 안 함)

### graceful shutdown
`onModuleDestroy`로 SIGTERM 받으면 connection 정리 — 메시지 유실 방지.

---

## 3. BullMQ — 잡 큐

### 왜 큐가 필요?
HTTP 요청 처리 중에 무거운 작업을 동기로 하면 응답이 느려짐 + 요청 시간이 늘어남.

예: 사진 업로드 후 썸네일 생성 — sharp가 100ms~ 걸림. 100개 사진 동시 업로드면 worker 다 점유.

→ **큐에 던지고 즉시 응답**. 워커가 백그라운드로 처리.

### BullMQ 구조
- **Queue**: 잡이 쌓이는 곳
- **Producer**: 잡을 큐에 넣는 쪽 (보통 컨트롤러·서비스)
- **Worker (Processor)**: 잡을 꺼내 처리하는 쪽 (백그라운드 프로세스)
- **Redis**: 큐와 워커의 통신 매개

### `apps/api/src/queues/queue.module.ts`
```ts
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config) => {
        const url = new URL(config.get('REDIS_URL') ?? DEFAULT_REDIS_URL);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: url.password || undefined,
            db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
            maxRetriesPerRequest: null,   // ← 핵심
          },
        };
      },
    }),
    BullModule.registerQueue({ name: IMAGE_PROCESSING_QUEUE }),
  ],
})
export class QueueModule {}
```

### `maxRetriesPerRequest: null`이 뭔가
- BullMQ 워커는 `BRPOP`(blocking pop) 명령으로 잡을 기다림
- ioredis 기본은 명령이 일정 시간 응답 없으면 재시도 → blocking 명령엔 부적합
- `null`로 설정해 재시도 비활성화 = **공식 권장값**

---

## 4. Producer — 잡 푸시

```ts
// 예: 사진 업로드 후
@Injectable()
export class PhotosService {
  constructor(@InjectQueue(IMAGE_PROCESSING_QUEUE) private queue: Queue) {}

  async createPhoto(...) {
    const photo = await this.repo.insert(...);
    await this.queue.add(IMAGE_PROCESSING_JOB.GENERATE_THUMBNAIL, {
      jobId: photo.imageJobId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return photo;
  }
}
```

### `attempts`, `backoff`
- `attempts: 3`: 실패 시 3번까지 재시도
- `backoff: exponential, delay: 1000`: 1초 → 2초 → 4초 간격

---

## 5. Worker (Processor)

`apps/api/src/image-processing/image-thumbnail.processor.ts:23`:
```ts
@Processor(IMAGE_PROCESSING_QUEUE)
export class ImageThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageThumbnailProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    private readonly imageJobs: ImageProcessingJobsRepository,
    private readonly moduleRef: ModuleRef,
  ) { super(); }

  async process(job: Job<ThumbnailJobData>): Promise<void> {
    if (job.name !== IMAGE_PROCESSING_JOB.GENERATE_THUMBNAIL) return;

    const { jobId } = job.data;
    const record = await this.imageJobs.findById(jobId);
    if (!record) return;

    await this.imageJobs.updateStatus(jobId, 'processing', { attempts: job.attemptsMade + 1 });

    try {
      const thumbnailKey = buildThumbnailKey(record.sourceKey);
      await this.imageProcessing.generateThumbnail(record.sourceKey, thumbnailKey);
      await this.applyToDomain(record.targetType, record.targetId, thumbnailKey);
      await this.imageJobs.updateStatus(jobId, 'completed', { thumbnailKey });
    } catch (err) {
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (isFinalAttempt) {
        await this.imageJobs.updateStatus(jobId, 'failed', { errorCode: 'THUMBNAIL_FAILED' });
      }
      throw err;
    }
  }
}
```

### 디자인 포인트

#### (1) `ModuleRef`로 lazy resolve
```ts
const repo = this.moduleRef.get(PhotosRepository, { strict: false });
```
→ image-processing 모듈이 photos/invitations/users 모듈을 직접 import하지 않게. 순환 의존 회피.

#### (2) DB job 상태 트래킹
- 큐 자체엔 잡이 쌓였다 사라짐
- 비즈니스 관점의 상태(`pending` → `processing` → `completed`/`failed`)는 `image_processing_jobs` DB 테이블에 별도 기록
- 클라이언트가 jobId로 진행 상황 조회 가능

#### (3) 최종 시도에서만 `failed` 마킹
```ts
const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
if (isFinalAttempt) await this.imageJobs.updateStatus(..., 'failed', ...);
throw err;   // BullMQ가 재시도 결정
```
- 중간 시도 실패는 status를 그대로 둠 (재시도 중)
- 모든 시도 소진 시에만 `failed`로 확정

---

## 6. 큐의 다른 활용 예 (잠재)

- **AI 합성 잡** (`ai_image_jobs`): OpenAI 호출 — 60초 timeout, 무거움
- **알림 발송 (FCM, APNS)**: 외부 API 응답 느림
- **이메일 발송**: SMTP 응답 느림, 재시도 필요
- **리마인더 (date-vote 마감 30분 전)**: 스케줄링 + 발송

WARA에선 현재 image-processing만 활성. 나머진 도메인 service에서 동기 처리.

---

## 7. Cache Manager — KV 캐시

`apps/api/src/app.module.ts:56`:
```ts
CacheModule.registerAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: (config) => {
    const url = config.get<string>('REDIS_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('REDIS_URL is required in production');
    }
    return { stores: [createKeyv(url ?? 'redis://localhost:6379')] };
  },
}),
```

### 사용
```ts
@Injectable()
export class WeatherService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getWeather(placeId: string) {
    const cached = await this.cache.get(`weather:${placeId}`);
    if (cached) return cached;

    const data = await this.fetchFromAPI(placeId);
    await this.cache.set(`weather:${placeId}`, data, 60 * 10 * 1000);  // 10분
    return data;
  }
}
```

### 왜 `@keyv/redis`인가
- `cache-manager`는 store 추상화만 제공
- 실제 저장소는 별도 라이브러리 (in-memory, Redis, ...)
- `@keyv/redis`가 NestJS와 잘 맞고 TTL 정확

---

## 8. Refresh Token 저장 — Auth Redis Store

`apps/api/src/auth/auth.redis-store.ts` (개념):
```ts
@Injectable()
export class AuthRedisStore {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async save(tokenHash: string, userId: string, ttlSec: number) {
    await this.redis.set(`rt:${tokenHash}`, userId, 'EX', ttlSec);
  }

  async findUserId(tokenHash: string): Promise<string | null> {
    return this.redis.get(`rt:${tokenHash}`);
  }

  async revoke(tokenHash: string) {
    await this.redis.del(`rt:${tokenHash}`);
  }

  async revokeAllForUser(userId: string) {
    // SCAN + DEL 패턴
  }
}
```

### 핵심
- raw refresh token은 **저장 안 함** (sha256 해시만)
- TTL = refresh token 만료 시간 → Redis가 자동 정리
- 회전(rotation) 시 옛 토큰 즉시 `DEL`

→ [05. 인증 시스템](./05-auth.md)의 토큰 회전과 연결.

---

## 9. Idempotency — Redis 락 + 응답 캐시

`apps/api/src/idempotency/idempotency.interceptor.ts:28`:
```ts
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyRedisStore) {}

  intercept(context, next): Observable<unknown> {
    // ... 헤더 검증
    const parts = {
      scope: req.user?.id ?? 'anon',
      method: req.method,
      path: req.path,
      idempotencyKey,
    };

    return from(this.store.find(parts)).pipe(
      switchMap((cached) => {
        if (cached === 'in_progress') {
          return throwError(() => new ConflictException(ErrorCode.IDEMPOTENCY_IN_PROGRESS));
        }
        if (cached) {
          res.status(cached.status);
          res.setHeader(IDEMPOTENCY_REPLAYED_HEADER, 'true');
          return of(cached.body);   // ← 캐시된 응답 재사용
        }
        return from(this.store.tryLock(parts)).pipe(
          switchMap((locked) => {
            if (!locked) return throwError(() => new ConflictException(ErrorCode.IDEMPOTENCY_IN_PROGRESS));
            return next.handle().pipe(
              tap((body) => {
                const status = res.statusCode;
                if (status >= 200 && status < 300) {
                  void this.store.saveResponse(parts, { status, body });   // 2xx만 캐시
                } else {
                  void this.store.releaseLock(parts);                       // 비-2xx는 락 해제
                }
              }),
              catchError((err) =>
                from(this.store.releaseLock(parts)).pipe(
                  switchMap(() => throwError(() => err)),
                ),
              ),
            );
          }),
        );
      }),
    );
  }
}
```

### 흐름
1. POST/PATCH/DELETE에 `Idempotency-Key` 헤더가 있으면 발동
2. Redis에 `(userId + method + path + key)` 조합으로 찾음
3. **이미 처리 중**: `IDEMPOTENCY_IN_PROGRESS` (409)
4. **이미 완료**: 캐시된 응답 그대로 + `X-Idempotency-Replayed: true` 헤더
5. **처음**: 락 잡고 처리 → 2xx면 캐시, 그 외엔 락 해제 (재시도 가능)

### Race condition 케이스
- A 요청: `find()`에 캐시 없음 → `tryLock()`
- B 요청: 같은 키로 `find()` → 아직 락도 캐시도 없음 → `tryLock()`
- A 또는 B 중 하나만 락 성공 → 다른 쪽은 `IDEMPOTENCY_IN_PROGRESS`

→ `SET ... NX EX`로 atomic하게 락 시도해서 race 해결.

### TTL
캐시된 응답은 TTL 후 사라짐 (예: 24시간). 같은 key로 한참 후에 다시 보내면 다시 처리됨.

---

## 10. Socket.IO Redis Adapter

`apps/api/package.json:44`:
```json
"@socket.io/redis-adapter": "^8.3.0"
```

### 왜 필요?
- 단일 인스턴스: 같은 프로세스 안에서 emit하면 그 프로세스의 모든 연결에 전달
- 다중 인스턴스 (수평 확장): emit한 인스턴스만 전달, 다른 인스턴스에 연결된 사용자는 못 받음
- → Redis adapter가 인스턴스 간 메시지를 Pub/Sub로 동기화

WARA는 현재 EC2 1대지만 향후 대비.

`main.ts:101`:
```ts
app.useWebSocketAdapter(new WaraIoAdapter(app));
```
- `WaraIoAdapter`가 Redis adapter 활성화 + CORS 일괄 적용

---

## 11. Redis 운영 팁

### 메모리 한도
- Redis 7-alpine 기본은 무제한
- 운영에선 `maxmemory` + `maxmemory-policy` (예: `allkeys-lru`) 설정 권장
- WARA는 현재 기본값 (트래픽 작음)

### persistence
`docker run`에 `redis-server --appendonly yes` → AOF 활성화. 재시작 시 데이터 복구.

### MONITOR / SLOWLOG
- `MONITOR`: 실시간 모든 명령 보기 (디버그용, prod에선 비싸므로 짧게만)
- `SLOWLOG GET 10`: 느린 명령 상위 10

### TTL 누락 주의
- TTL 안 걸린 키는 영원히 남음 → 메모리 leak
- 모든 `SET`에 EX 옵션 또는 별도 `EXPIRE`

---

## 12. 흔한 함정

### Pub/Sub 연결을 일반 명령에도 씀
SUBSCRIBE 모드 연결은 다른 명령 못 받음. 일반/pub/sub 3개 분리가 정석.

### Worker가 동시에 같은 잡 실행
BullMQ는 자동 락. 다만 `attempts` 재시도 중에 이전 워커가 죽으면 다른 워커가 가져갈 수 있음. **idempotent하게** 작성.

### 큐가 폭주
- producer가 worker보다 빠르면 큐 무한 증가
- 모니터링: `queue.getJobCounts()`로 waiting/active 카운트 주기 확인

### Redis 한 인스턴스에 모든 거 몰아넣음
- BullMQ + 캐시 + Pub/Sub가 같은 인스턴스
- 한쪽 부하가 다른 쪽에 영향 (예: 큐 폭주로 캐시 GET 느려짐)
- 트래픽 늘면 인스턴스/DB 분리 검토

### Idempotency-Key 미보호 라우트
mutation인데 적용 안 하면 같은 요청이 두 번 처리될 위험. 결제·중요 변경은 무조건.

---

## 13. 체크리스트

- [ ] WARA가 Redis 한 인스턴스로 4개 용도 처리하는 걸 안다
- [ ] Redis 연결을 client/pub/sub 3개로 나누는 이유를 안다
- [ ] BullMQ의 `maxRetriesPerRequest: null`이 왜 필요한지 안다
- [ ] Producer / Worker / 잡 상태 트래킹의 분리를 그릴 수 있다
- [ ] Idempotency 인터셉터의 락+캐시 패턴 흐름을 안다
- [ ] Socket.IO Redis adapter가 수평 확장에 어떻게 필요한지 안다

→ 다음: [18. Claude Code로 이 프로젝트 작업하기](./18-claude-code-workflow.md)
