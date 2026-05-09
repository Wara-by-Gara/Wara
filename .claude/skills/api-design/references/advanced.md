# 고급 패턴 심화

## 인증 & 인가

### JWT 인증

```ts
// middlewares/auth.ts (Express 기준, Hono는 패턴 동일)
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

// 토큰 발급
export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

// auth 미들웨어
export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHORIZED', '로그인이 필요합니다');

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    next();
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', '토큰이 유효하지 않습니다');
  }
};

// 권한 미들웨어
export const authorize = (...roles: string[]): RequestHandler => (req, res, next) => {
  if (!roles.includes(req.user!.role)) {
    throw new AppError(403, 'FORBIDDEN', '접근 권한이 없습니다');
  }
  next();
};

// 사용 예시
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
```

### Refresh Token 전략

```ts
// POST /auth/refresh 패턴
// Access Token: 짧게 (15분 ~ 1시간)
// Refresh Token: 길게 (7일 ~ 30일), DB에 저장하여 revoke 가능하게

export const refreshTokens = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  // 1. 토큰 검증
  const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET!) as { sub: string };
  
  // 2. DB에서 저장된 refresh token과 비교 (revoke 체크)
  const stored = await tokenRepo.findByUserId(payload.sub);
  if (!stored || stored.token !== refreshToken) {
    throw new AppError(401, 'REFRESH_TOKEN_INVALID', '갱신 토큰이 유효하지 않습니다');
  }
  
  // 3. 새 토큰 발급 (Rotation)
  const user = await usersService.findById(payload.sub);
  const newAccess = signToken({ sub: user.id, email: user.email, role: user.role });
  const newRefresh = signRefreshToken({ sub: user.id });
  
  // 4. DB 갱신
  await tokenRepo.update(user.id, newRefresh);
  
  res.json(ok({ accessToken: newAccess, refreshToken: newRefresh }));
};
```

### API Key 인증

```ts
export const apiKeyAuth: RequestHandler = async (req, res, next) => {
  const key = req.headers['x-api-key'] as string;
  if (!key) throw new AppError(401, 'UNAUTHORIZED', 'API 키가 필요합니다');

  // DB에서 해시된 키와 비교 (평문 저장 금지)
  const hashed = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = await apiKeyRepo.findByHash(hashed);
  
  if (!apiKey || apiKey.revokedAt) {
    throw new AppError(401, 'API_KEY_INVALID', '유효하지 않은 API 키입니다');
  }
  
  // 마지막 사용 시각 갱신 (비동기, 응답 대기 불필요)
  apiKeyRepo.updateLastUsed(apiKey.id).catch(console.error);
  
  req.apiKey = apiKey;
  next();
};
```

---

## 페이지네이션

### Offset 기반 (일반적인 경우)

```ts
// 쿼리 파라미터: ?page=2&limit=20&sort=createdAt&order=desc

export const listUsersHandler = async (req: Request, res: Response) => {
  const { page, limit, sort, order, search } = req.query as ListUsersQuery;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.select().from(users)
      .where(search ? ilike(users.name, `%${search}%`) : undefined)
      .orderBy(order === 'desc' ? desc(users[sort]) : asc(users[sort]))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(users)
      .where(search ? ilike(users.name, `%${search}%`) : undefined)
      .then(r => Number(r[0].count)),
  ]);

  return res.json(list(data, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  }));
};
```

### Cursor 기반 (무한 스크롤, 대용량)

```ts
// 쿼리 파라미터: ?cursor=<lastId>&limit=20
// cursor: 마지막으로 본 레코드의 ID (또는 createdAt + id 복합)

export const listWithCursor = async (req: Request, res: Response) => {
  const { cursor, limit = 20 } = req.query;

  const data = await db.select().from(posts)
    .where(cursor ? lt(posts.id, cursor) : undefined)  // cursor 이전 레코드만
    .orderBy(desc(posts.id))
    .limit(limit + 1);  // 1개 더 가져와서 hasNext 판단

  const hasNext = data.length > limit;
  if (hasNext) data.pop();

  return res.json({
    success: true,
    data,
    meta: {
      nextCursor: hasNext ? data[data.length - 1].id : null,
      hasNext,
    }
  });
};
```

> **Offset vs Cursor 선택 기준**
> - Offset: 페이지 번호 UI, 전체 개수 필요, 데이터 1만 건 이하
> - Cursor: 무한 스크롤, 실시간 데이터(삽입/삭제 잦음), 대용량(수십만+)

---

## Rate Limiting

### express-rate-limit (Express)

```ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// 기본 Rate Limit (전체 API)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  limit: 100,
  standardHeaders: 'draft-7',  // RateLimit 헤더 반환
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' } },
  // 분산 환경에서는 Redis Store 사용
  store: new RedisStore({ client: redis }),
});

// 로그인 전용 엄격한 제한
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,  // 15분에 5번만
  skipSuccessfulRequests: true,  // 성공한 요청은 카운트 제외
});

// 적용
app.use('/api', globalLimiter);
app.post('/api/v1/auth/login', authLimiter, loginHandler);
```

### Hono용 Rate Limit

```ts
import { rateLimiter } from 'hono-rate-limiter';

app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? 'unknown',
}));
```

---

## 멱등성 (Idempotency)

POST 요청의 중복 실행 방지. 결제, 이메일 발송, 주문 생성 등에 필수.

```ts
// 클라이언트는 고유한 Idempotency-Key 헤더를 보낸다
// POST /orders
// Idempotency-Key: <uuid v4>

export const idempotency: RequestHandler = async (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  const key = req.headers['idempotency-key'] as string;
  if (!key) return next();  // 키 없으면 그냥 통과 (강제 여부는 정책에 따라)

  // UUID 형식 검증
  if (!/^[0-9a-f-]{36}$/.test(key)) {
    throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key는 UUID 형식이어야 합니다');
  }

  const cacheKey = `idempotency:${req.user!.id}:${key}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    // 이미 처리된 요청 — 캐시된 응답 그대로 반환
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  // 응답을 가로채서 Redis에 저장
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // 성공 응답만 캐시 (5분 ~ 24시간, 비즈니스에 따라)
    if (res.statusCode < 400) {
      redis.setex(cacheKey, 86400, JSON.stringify({ status: res.statusCode, body }));
    }
    return originalJson(body);
  };

  next();
};
```

---

## OpenAPI / Swagger 문서화

### Hono + @hono/zod-openapi

```ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

const app = new OpenAPIHono();

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  request: {
    body: { content: { 'application/json': { schema: createUserSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: z.object({ success: z.literal(true), data: userSchema }) } },
      description: '유저 생성 성공',
    },
    400: { content: { 'application/json': { schema: apiErrorSchema } }, description: '입력값 오류' },
  },
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid('json');
  const user = await usersService.create(body);
  return c.json(ok(user), 201);
});

// Swagger UI 자동 생성
app.doc('/api/docs', { openapi: '3.0.0', info: { title: 'My API', version: '1.0.0' } });
```

### Express + swagger-jsdoc (JSDoc 방식)

```ts
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const spec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'My API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],  // JSDoc 주석을 파싱
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));

// 라우터 파일에 JSDoc 주석 추가
/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: 유저 생성
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: 생성 성공
 */
```

---

## 파일 업로드

```ts
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 메모리 스토리지 (S3 등 외부 업로드 시)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError(400, 'INVALID_FILE_TYPE', '지원하지 않는 파일 형식입니다'));
    }
    cb(null, true);
  },
});

export const uploadAvatar: RequestHandler[] = [
  upload.single('avatar'),
  async (req, res) => {
    if (!req.file) throw new AppError(400, 'FILE_REQUIRED', '파일이 필요합니다');

    const key = `avatars/${req.user!.sub}/${Date.now()}-${req.file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `https://${process.env.CDN_DOMAIN}/${key}`;
    await usersService.update(req.user!.sub, { avatarUrl: url });

    res.json(ok({ url }));
  },
];
```

---

## Webhook

```ts
// Webhook 발신 (외부 서비스에 이벤트 알림)
export class WebhookService {
  async dispatch(endpoint: string, event: string, payload: unknown, secret: string) {
    const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
    
    // HMAC-SHA256 서명 — 수신자가 진위 검증 가능
    const sig = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${sig}`,
        'X-Webhook-Event': event,
      },
      body,
      signal: AbortSignal.timeout(10_000),  // 10초 타임아웃
    });
  }
}

// Webhook 수신 시 서명 검증
export const verifyWebhookSignature: RequestHandler = (req, res, next) => {
  const sig = req.headers['x-webhook-signature'] as string;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new AppError(401, 'INVALID_SIGNATURE', '서명이 올바르지 않습니다');
  }
  next();
};
```

---

## CORS & Security Headers

```ts
// Express
import cors from 'cors';
import helmet from 'helmet';

app.use(helmet());  // X-Content-Type-Options, X-Frame-Options, etc.
app.use(cors({
  origin: (origin, cb) => {
    const allowed = process.env.ALLOWED_ORIGINS!.split(',');
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS 정책에 의해 차단되었습니다'));
  },
  credentials: true,              // 쿠키/인증 헤더 허용
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'Idempotency-Key'],
}));
```
