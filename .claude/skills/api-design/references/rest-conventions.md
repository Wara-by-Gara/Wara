# RESTful 설계 심화

## 네이밍 컨벤션

### URL 설계 규칙

```
✅ 복수 명사, 소문자 kebab-case
GET  /blog-posts
GET  /blog-posts/:id

✅ 중첩은 소유 관계가 명확할 때만, 최대 2단계
GET  /users/:userId/posts
GET  /users/:userId/posts/:postId

❌ 3단계 이상 중첩 — 독립 리소스로 분리
/users/:userId/posts/:postId/comments/:commentId  →  /comments/:commentId

✅ 리소스 간 관계 표현 (소유 관계 없을 때)
POST /users/:userId/follow           ← 동사 허용 (액션)
POST /posts/:postId/publish
POST /orders/:orderId/cancel

✅ 검색/필터는 쿼리 파라미터
GET /posts?status=published&tag=nodejs&authorId=abc

❌ 필터를 URL 경로에 넣지 않는다
/posts/published  →  /posts?status=published
```

### 쿼리 파라미터 네이밍

```
페이지네이션:  page, limit (또는 perPage)
커서:         cursor, after, before
정렬:         sort=createdAt, order=desc (또는 orderBy=createdAt:desc)
검색:         search, q
필터:         status=active, type=admin, createdAfter=2024-01-01
필드 선택:    fields=id,name,email (GraphQL-like partial response)
```

---

## 표준 에러 코드 목록

응답 body의 `error.code`로 사용. 클라이언트가 코드 분기 처리할 수 있도록 일관성을 지킨다.

### 4xx 클라이언트 에러

| HTTP | code | 상황 |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Zod 등 입력 검증 실패 |
| 400 | `INVALID_PARAM` | URL 파라미터 형식 오류 |
| 400 | `INVALID_CURSOR` | 커서 페이지네이션 커서 오류 |
| 400 | `FILE_TOO_LARGE` | 업로드 파일 크기 초과 |
| 400 | `INVALID_FILE_TYPE` | 허용하지 않는 파일 형식 |
| 401 | `UNAUTHORIZED` | 인증 정보 없음 |
| 401 | `TOKEN_EXPIRED` | JWT 만료 |
| 401 | `TOKEN_INVALID` | JWT 서명 불일치 |
| 401 | `API_KEY_INVALID` | API Key 불일치/폐기 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 403 | `EMAIL_NOT_VERIFIED` | 이메일 미인증 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 이미 존재 (이메일 중복 등) |
| 409 | `OPTIMISTIC_LOCK_CONFLICT` | 낙관적 락 충돌 |
| 422 | `UNPROCESSABLE` | 형식은 맞으나 비즈니스 로직 실패 |
| 429 | `TOO_MANY_REQUESTS` | Rate Limit 초과 |

### 5xx 서버 에러

| HTTP | code | 상황 |
|------|------|------|
| 500 | `INTERNAL_ERROR` | 알 수 없는 서버 오류 |
| 502 | `UPSTREAM_ERROR` | 외부 서비스 오류 |
| 503 | `SERVICE_UNAVAILABLE` | 점검/과부하 |

---

## 필터링 & 정렬 패턴

### 범위 필터

```
GET /orders?createdAfter=2024-01-01&createdBefore=2024-12-31
GET /products?priceMin=10000&priceMax=50000
GET /users?status=active,pending   ← 복수 값은 쉼표 구분
```

```ts
// Zod 스키마
const listOrdersSchema = z.object({
  createdAfter:  z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  status:        z.string().transform(s => s.split(',')).optional(),  // "active,pending" → ["active", "pending"]
  priceMin:      z.coerce.number().optional(),
  priceMax:      z.coerce.number().optional(),
}).refine(
  (d) => !d.createdAfter || !d.createdBefore || d.createdAfter <= d.createdBefore,
  { message: 'createdAfter가 createdBefore보다 클 수 없습니다', path: ['createdAfter'] }
);
```

### 다중 정렬

```
GET /posts?sort=createdAt:desc,title:asc
```

```ts
const sortSchema = z.string()
  .transform(s => s.split(',').map(pair => {
    const [field, order] = pair.split(':');
    return { field, order: order ?? 'asc' };
  }))
  .optional();
```

### Partial Response (필드 선택)

```
GET /users?fields=id,name,email   ← 필요한 필드만 응답
```

```ts
export const selectFields = <T extends object>(obj: T, fields?: string): Partial<T> => {
  if (!fields) return obj;
  const allowed = fields.split(',');
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => allowed.includes(key))
  ) as Partial<T>;
};
```

---

## 버전 관리 전략 심화

### 버전 증가 기준

| 변경 유형 | 버전 올려야 하나? |
|----------|---------------|
| 새 필드 추가 (응답) | ❌ 하위 호환 |
| 새 엔드포인트 추가 | ❌ 하위 호환 |
| 필드 삭제 | ✅ 브레이킹 체인지 |
| 필드 이름 변경 | ✅ 브레이킹 체인지 |
| 타입 변경 (string → number) | ✅ 브레이킹 체인지 |
| 동작 변경 (정렬 기본값 등) | ✅ 브레이킹 체인지 |

### Sunset 정책

```ts
// 이전 버전 엔드포인트 폐기 예고 헤더
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Sunset', 'Sat, 31 Dec 2025 23:59:59 GMT');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/v2/docs>; rel="successor-version"');
  next();
});
```

---

## 헬스체크 & 상태 엔드포인트

```ts
// GET /health — 로드밸런서 헬스체크용 (빠르게 200 반환)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /health/ready — 의존성 포함한 준비 상태 (DB, Redis 연결 확인)
app.get('/health/ready', async (req, res) => {
  const checks = await Promise.allSettled([
    db.execute(sql`SELECT 1`),
    redis.ping(),
  ]);

  const [db_check, redis_check] = checks;
  const healthy = checks.every(c => c.status === 'fulfilled');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks: {
      database: db_check.status === 'fulfilled' ? 'ok' : 'fail',
      redis:    redis_check.status === 'fulfilled' ? 'ok' : 'fail',
    },
  });
});
```

---

## 응답 압축 & 성능

```ts
import compression from 'compression';

// 1KB 이상 응답은 gzip 압축
app.use(compression({ threshold: 1024 }));

// ETag 기반 캐싱 (GET 요청 304 응답 활용)
import etag from 'etag';

export const withEtag: RequestHandler = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const tag = etag(JSON.stringify(body));
    res.setHeader('ETag', tag);
    if (req.headers['if-none-match'] === tag) {
      return res.status(304).end();
    }
    return originalJson(body);
  };
  next();
};

// 정적 데이터 Cache-Control
res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
// 개인 데이터
res.setHeader('Cache-Control', 'private, no-store');
```

---

## 요청 ID 추적 (Request Tracing)

```ts
import { randomUUID } from 'crypto';

export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);  // 클라이언트에 반환 (디버깅용)
  next();
};

// 로거에 request ID 포함
app.use(requestId);
app.use((req, res, next) => {
  console.log({ requestId: req.id, method: req.method, url: req.url });
  next();
});
```
