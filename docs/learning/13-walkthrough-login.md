# 13. 워크스루 — 카카오 로그인 요청 1건

> 모바일 앱이 `POST /api/auth/kakao/token`을 한 번 보낸다. 백엔드 코드를 한 줄씩 따라가본다.

---

## 0. 시나리오

```
앱이 카카오 SDK로 자체 로그인 → providerToken 받음
앱 → POST https://api.wara.kr/api/auth/kakao/token
       Body: { providerToken: "kakao_token..." }
```

목표: 새 access/refresh JWT를 받아 `{ success: true, data: { accessToken, refreshToken, ... } }` 응답.

---

## 1. nginx → API 컨테이너

EC2의 nginx가 받음.
- TLS 종료
- 443 → `http://localhost:3001`로 프록시
- 컨테이너 `wara-api`로 도달

---

## 2. Sentry instrument (가장 먼저 import)

`apps/api/src/main.ts:3`:
```ts
import './sentry/instrument';   // ← 첫 줄. NestFactory보다 먼저
import { NestFactory } from '@nestjs/core';
```
- prod + DSN이 있으면 `Sentry.init`이 실행되어 HTTP·DB 자동 계측
- 이후 어디서든 throw되는 5xx 에러가 Sentry에 자동 캡처됨

---

## 3. bootstrap — 환경변수 검증

`main.ts:20`:
```ts
async function bootstrap() {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('[보안] JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다.');
  if (process.env.JWT_ACCESS_SECRET.length < 32) throw new Error('[보안] JWT_ACCESS_SECRET 길이 부족');
  if (!process.env.FRONTEND_URL) throw new Error('[보안] FRONTEND_URL 환경변수가 설정되지 않았습니다.');
  if (!process.env.COOKIE_SECRET) throw new Error('[보안] COOKIE_SECRET 환경변수가 설정되지 않았습니다.');
```
- 부팅 시점 검증. 누락이면 즉시 종료 — 운영에서 fallback secret으로 떠 있는 사고 차단.

---

## 4. 미들웨어 체인

`main.ts:42`~:
```ts
app.use(helmet());                 // 보안 헤더 (XSS, clickjacking 등)
// ... Swagger CSP 제외 (prod 아닐 때만)
app.use(compression());            // gzip 응답 압축
app.setGlobalPrefix('api');        // 모든 라우트 /api prefix
app.enableCors({                   // CORS
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: dev ? ['X-DB-Time', 'X-DB-Query-Count'] : [],
});
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalInterceptors(new DbTimeInterceptor(), new ResponseFormatInterceptor());
app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
app.use(cookieParser(cookieSecret));
app.useWebSocketAdapter(new WaraIoAdapter(app));
```

→ 우리 요청(POST /api/auth/kakao/token)에 적용되는 순서:
1. helmet (응답 헤더 추가)
2. compression
3. CORS check (앱이 보낸 Origin 확인)
4. cookieParser (이 요청은 쿠키 없으므로 사실상 패스)

---

## 5. CSRF 미들웨어

`main.ts:106`:
```ts
const allowedOrigin = process.env.FRONTEND_URL!.replace(/\/$/, '');
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

  const cookies = req.cookies as Record<string, string> | undefined;
  const hasCookieAuth = !!cookies?.accessToken || !!cookies?.refreshToken;
  if (!hasCookieAuth) return next();        // ← 모바일 Bearer 요청은 면제

  // ... Origin/Referer 검증
});
```

**모바일 요청은 쿠키가 없음 → 그냥 `next()` 통과.**

---

## 6. NestJS 라우팅

요청이 NestJS 본체에 도달. URL `/api/auth/kakao/token`에 글로벌 prefix `/api`를 제외하면 `/auth/kakao/token`.

NestJS가 컨트롤러 매칭:
- `@Controller('auth')` → `AuthController`
- `@Post(':provider/token')` → `mobileTokenLogin()` 핸들러

`apps/api/src/auth/auth.controller.ts:172`:
```ts
@Public()
@Post(':provider/token')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { ttl: 60000, limit: 10 } })
mobileTokenLogin(
  @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
  @Body(new ZodValidationPipe(MobileTokenSchema)) body: MobileTokenDto,
) {
  return this.authService.socialLoginWithProviderToken({ provider, providerToken: body.providerToken });
}
```

### 데코레이터 해석
- `@Public()` → 글로벌 `JwtAuthGuard` 스킵 (로그인 안 한 상태에서 호출되니까 당연)
- `@Post(':provider/token')` → POST 라우트
- `@HttpCode(200)` → 기본 201 대신 200 (로그인은 자원 생성이 아니므로)
- `@Throttle({ ttl: 60000, limit: 10 })` → 1분에 10회 제한 (brute force 방지)

---

## 7. Guard 체인 (글로벌 + 로컬)

`auth.module.ts:67` 글로벌 가드:
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },        // ← @Public()이면 스킵
{ provide: APP_GUARD, useClass: RolesGuard },          // @Roles() 없으면 스킵
{ provide: APP_GUARD, useClass: RequiredTermsGuard },  // 토큰 없는 요청이라 스킵
```

`@Throttle` 데코레이터로 인해 `ThrottlerGuard`도 적용 → Redis에서 IP/user별 카운트 증가, 한도 초과면 `429 RATE_LIMIT_EXCEEDED`.

---

## 8. Pipe — 입력 검증

### Param 검증
```ts
@Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto
```
- URL의 `:provider`가 `'kakao' | 'naver' | 'google' | 'apple'` 중 하나인지
- 아니면 400 + `VALIDATION_ERROR`

### Body 검증
```ts
@Body(new ZodValidationPipe(MobileTokenSchema)) body: MobileTokenDto
```
- `{ providerToken: string }` 형식인지
- 없거나 빈 문자열이면 400 + 검증 에러

여기까지 통과하면 컨트롤러 핸들러 진입.

---

## 9. 컨트롤러는 얇게

```ts
mobileTokenLogin(...) {
  return this.authService.socialLoginWithProviderToken({ provider, providerToken: body.providerToken });
}
```
- 검증 통과한 입력을 그대로 서비스에 위임
- 비즈니스 로직 없음

---

## 10. 서비스 진입 — `socialLoginWithProviderToken`

`AuthService.socialLoginWithProviderToken({ provider: 'kakao', providerToken: '...' })`

대략의 흐름:
```ts
1. SocialAuthFactory.getStrategy(provider) → KakaoStrategy
2. strategy.getUserInfo(providerToken)
   → 카카오 서버에 GET https://kapi.kakao.com/v2/user/me
   → 응답에서 카카오 user id, email, nickname 등 추출
3. AuthRepository.findOrCreateUser(provider, providerAccountId, profile)
   → social_accounts 테이블에서 검색
   → 있으면 user 반환
   → 없으면 users + social_accounts 트랜잭션 INSERT
4. issueAccessToken({ sub: user.id, role: user.role })
5. issueRefreshToken(user.id)
   → randomBytes로 raw refresh 생성
   → sha256 해시 → AuthRedisStore.save(hash, userId, ttl)
6. needsProfileCompletion = !user.nickname || !user.birthYear
7. return { accessToken, refreshToken, refreshExpiresIn, needsProfileCompletion }
```

### 외부 API 실패 시
- 토큰 검증 실패 → `AUTH_PROVIDER_TOKEN_INVALID` (401)
- 카카오 서버 timeout → `APPLE_SERVER_TIMEOUT` (애플 전용 코드지만 패턴은 비슷)

### DB 트랜잭션
```ts
await this.db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ ... }).returning();
  await tx.insert(socialAccounts).values({ userId: user.id, ... });
  return user;
});
```
중간 실패면 자동 롤백.

---

## 11. 응답 — Interceptor가 envelope

서비스가 반환:
```ts
{ accessToken: 'eyJ...', refreshToken: 'rand...', refreshExpiresIn: 1209600, needsProfileCompletion: false }
```

`ResponseFormatInterceptor`가 가로채:
```ts
// apps/api/src/common/interceptors/response-format.interceptor.ts:18
intercept(context, next): Observable<unknown> {
  const meta = { requestId: resolveRequestId(req), timestamp: new Date().toISOString() };
  return next.handle().pipe(
    map((data) => data === undefined ? { success: true, meta } : { success: true, data, meta }),
  );
}
```

→ 최종 응답:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "refreshExpiresIn": 1209600,
    "needsProfileCompletion": false
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-06-13T..."
  }
}
```

`DbTimeInterceptor`가 dev 환경이면 `X-DB-Time` 응답 헤더 set.

---

## 12. 응답이 클라이언트로

NestJS → Express → 컨테이너 → nginx → TLS → 사용자.

앱은 받은 `accessToken`을 SecureStore에 저장, 다음 요청부터 `Authorization: Bearer <token>`으로.

---

## 13. 만약 에러가 났다면?

예: 카카오 API가 토큰 거부 → `KakaoStrategy`가 `throw new UnauthorizedException({ code: ErrorCode.AUTH_PROVIDER_TOKEN_INVALID })`.

흐름:
1. 서비스에서 throw
2. NestJS가 가로채 `HttpExceptionFilter` (또는 `AllExceptionsFilter`)에 전달
3. Filter가 `sendErrorResponse(host, 401, raw)` 호출
4. `pickCode(raw, 401)` → 'AUTH_PROVIDER_TOKEN_INVALID'
5. `statusToType(401)` → 'authentication'
6. 응답:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_PROVIDER_TOKEN_INVALID",
    "type": "authentication",
    "message": "..."
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

→ 자세한 에러 흐름은 [14. 에러 흐름](./14-error-flow.md).

---

## 14. 전체 요약 다이어그램

```
nginx (TLS 종료)
  ↓
Express 미들웨어: helmet → compression → CORS → cookieParser → CSRF(스킵)
  ↓
NestJS 라우팅: /api/auth/kakao/token → AuthController.mobileTokenLogin
  ↓
Guard: JwtAuthGuard(스킵, @Public) → ThrottlerGuard(60s/10회)
  ↓
Pipe: ZodValidationPipe(Param) → ZodValidationPipe(Body)
  ↓
Interceptor before: DbTimeInterceptor → ResponseFormatInterceptor
  ↓
Controller → AuthService.socialLoginWithProviderToken
  ↓
SocialAuthFactory → KakaoStrategy → 카카오 user info
  ↓
AuthRepository.findOrCreateUser (Drizzle 트랜잭션)
  ↓
JwtService.signAsync (access) + randomBytes + sha256 + Redis save (refresh)
  ↓
서비스 return { accessToken, refreshToken, ... }
  ↓
ResponseFormatInterceptor map → { success: true, data, meta }
  ↓
Express response → nginx → 사용자
```

---

## 15. 체크리스트

- [ ] 미들웨어·가드·파이프·인터셉터·필터의 실행 순서를 안다
- [ ] `@Public()`가 글로벌 가드를 어떻게 스킵하는지 안다
- [ ] ZodValidationPipe가 `@Param`/`@Body` 둘 다에서 동작한다는 걸 안다
- [ ] AuthService → Strategy → Repository 분리 이유를 안다
- [ ] ResponseFormatInterceptor가 응답을 어떻게 감싸는지 안다

→ 다음: [14. 에러 흐름](./14-error-flow.md)
