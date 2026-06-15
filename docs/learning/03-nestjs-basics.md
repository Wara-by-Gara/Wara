# 03. NestJS 기본기

> NestJS는 "Spring(Java) + Angular(TS)"를 합쳐놓은 듯한 백엔드 프레임워크다. **모듈/컨트롤러/서비스 + DI + decorator**라는 4가지 개념만 잡으면 끝.

---

## 1. 왜 NestJS인가

### Express 직접 쓰면 안 되나?
- ✅ 자유롭다
- ❌ 규모가 커지면 라우팅·검증·에러 처리·DI를 직접 짜야 함
- ❌ 팀이 커지면 사람마다 다른 패턴

### NestJS
- 모듈 단위로 코드 조직 (도메인 = 모듈)
- DI 컨테이너 내장 → 테스트 쉬움
- decorator로 검증/권한/로깅 일관되게
- TypeScript 일급 지원
- 내부는 Express 또는 Fastify를 그대로 씀 (우리는 Express)

WARA는 도메인 40개+의 큰 백엔드라 → NestJS의 모듈 구조가 큰 가치.

---

## 2. 4가지 핵심 빌딩블록

### (1) Module — 도메인의 경계
```ts
// apps/api/src/auth/auth.module.ts:28
@Global()
@Module({
  imports: [HttpModule, JwtModule.registerAsync(...)],
  controllers: [AuthController, AppleController],
  providers: [AuthService, AuthRepository, AuthRedisStore, ...],
  exports: [AuthService, AuthRepository, ...],
})
export class AuthModule {}
```

- `imports`: 다른 모듈을 가져옴 (그 모듈이 `exports`한 것만 사용 가능)
- `controllers`: HTTP 엔드포인트
- `providers`: DI 컨테이너에 등록할 서비스/저장소
- `exports`: 다른 모듈에 노출할 provider
- `@Global()`: 이 모듈이 어디서나 import 없이 사용 가능 (남용 금지)

### (2) Controller — HTTP 라우팅
```ts
// apps/api/src/auth/auth.controller.ts:32
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get(':provider/url')
  getAuthUrl(@Param() { provider }: ProviderParamDto, @Query('platform') platform: Platform) {
    return this.authService.getAuthorizationUrl(provider, platform);
  }
}
```

- `@Controller('auth')` → 모든 핸들러는 `/auth` prefix
- `@Get(':provider/url')` → `GET /auth/kakao/url`, `GET /auth/naver/url`...
- `@Param`, `@Query`, `@Body`, `@Req`, `@Res` → request 추출
- **컨트롤러는 얇게**. 검증 → 서비스 호출 → 응답만. 비즈니스 로직 금지.

### (3) Service — 비즈니스 로직
```ts
// apps/api/src/auth/auth.service.ts:15
@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly refreshStore: AuthRedisStore,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly socialAuthFactory: SocialAuthFactory,
    private readonly oauthPolicyService: OauthPolicyService,
  ) {}

  generateState(): string {
    return this.jwtService.sign(
      { nonce: randomUUID() },
      { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: '10m' }
    );
  }
}
```

- `@Injectable()` → DI 컨테이너에 등록 가능
- `constructor` 인자가 곧 의존성 (DI가 자동 주입)
- 여러 Repository/Service를 조합해 비즈니스 로직 작성

### (4) Repository — DB 접근만
WARA에서는 별도 Repository 클래스를 둠 (NestJS 기본은 아님).
```ts
// 컨셉
@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  findUserBySocial(provider, providerAccountId) {
    return this.db.select().from(users)...;
  }
}
```

**규칙** (`apps/api/CLAUDE.md`):
- Controller → Service → Repository
- Service는 직접 DB 접근 금지, 반드시 Repository 경유
- Service ↔ Service 직접 호출 금지 (의존 그래프 망가짐)

---

## 3. DI(Dependency Injection)가 뭔가

### 옛날 방식
```ts
class AuthService {
  private repo = new AuthRepository();   // 직접 new
}
```
→ 테스트할 때 `AuthRepository`를 mock으로 바꿀 방법이 없다.

### DI 방식
```ts
class AuthService {
  constructor(private repo: AuthRepository) {}   // 생성자에서 받음
}
```
→ NestJS가 알아서 `AuthRepository` 인스턴스를 만들어 넣어준다. 테스트에서는 mock을 넣을 수 있다.

### DI 컨테이너의 동작
1. NestJS가 시작 시 `@Module({ providers: [...] })`를 보고 등록
2. `@Injectable()` 클래스의 생성자 타입을 보고 의존성 그래프 빌드
3. 필요할 때 자동 생성·주입 (싱글톤이 기본)

### 토큰 기반 주입
타입이 인터페이스이거나 동적으로 결정될 때는 Symbol 토큰 사용:
```ts
// apps/api/src/database/database.module.ts:7
export const DRIZZLE = Symbol('DRIZZLE');

@Module({
  providers: [{
    provide: DRIZZLE,
    inject: [ConfigService],
    useFactory: (configService) => drizzle(...),
  }],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

// 사용 측
@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}
}
```

---

## 4. Decorator란

TypeScript의 decorator는 클래스/메서드/파라미터에 메타데이터를 붙이는 문법.

```ts
@Controller('auth')   // 클래스 데코레이터
export class AuthController {
  @Get(':provider/url')                   // 메서드 데코레이터
  getAuthUrl(@Param() params: any) {}     // 파라미터 데코레이터
}
```

내부적으로는 `Reflect.defineMetadata`로 정보를 저장하고, NestJS가 시작 시 그 메타데이터를 읽어서 라우팅/검증/DI를 구성한다.

### 자주 보는 데코레이터

| 종류 | 예시 | 의미 |
|---|---|---|
| 클래스 | `@Controller('auth')` | 컨트롤러 + base path |
| 클래스 | `@Injectable()` | DI 가능 |
| 클래스 | `@Module({...})` | 모듈 정의 |
| 메서드 | `@Get/@Post/@Patch/@Delete` | HTTP 메서드 |
| 메서드 | `@HttpCode(200)` | 응답 status |
| 메서드 | `@Throttle({ ttl, limit })` | Rate limit |
| 파라미터 | `@Param/@Query/@Body/@Req/@Res` | request 추출 |
| 파라미터 | `@Inject(TOKEN)` | DI 토큰 명시 |
| 커스텀 | `@Public()`, `@HostOnly()` | 우리 프로젝트 자체 데코레이터 |

---

## 5. Pipe — 입력 검증·변환

`main.ts:72`:
```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // DTO에 없는 필드 제거
  forbidNonWhitelisted: true, // 없는 필드가 오면 400
  transform: true,            // string → number 같은 자동 변환
}));
```

→ class-validator 데코레이터(`@IsString()`, `@IsEmail()`)가 붙은 DTO는 자동으로 검증됨.

WARA는 **Zod 기반 ZodValidationPipe**도 함께 쓴다:
```ts
// auth.controller.ts:62
@Get(':provider/url')
getAuthUrl(@Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto) {}
```
Zod 스키마로 검증 → 실패 시 400 + `VALIDATION_ERROR` 코드.

---

## 6. Guard — 권한 체크

요청을 통과시킬지 결정. NestJS 라이프사이클에서 **Pipe보다 먼저** 실행.

`auth.module.ts:67`:
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
{ provide: APP_GUARD, useClass: RequiredTermsGuard },
```
→ 모든 요청에 글로벌 가드 3개가 순서대로 실행.

- **JwtAuthGuard**: 쿠키 또는 `Authorization: Bearer` 헤더에서 JWT 검증
- **RolesGuard**: `@Roles('host')` 같은 메서드 가드와 비교
- **RequiredTermsGuard**: 약관 동의 안 한 사용자 차단

`@Public()` 데코레이터가 붙은 핸들러는 가드를 스킵:
```ts
@Public()
@Get(':provider/url')
getAuthUrl(...) {}
```

---

## 7. Interceptor — 응답 가공·관찰

요청 전/후를 감쌈. RxJS Observable 기반.

`response-format.interceptor.ts:18`:
```ts
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = { requestId: resolveRequestId(...), timestamp: new Date().toISOString() };
    return next.handle().pipe(
      map((data) => data === undefined ? { success: true, meta } : { success: true, data, meta }),
    );
  }
}
```
→ 모든 success 응답을 `{ success: true, data, meta }`로 자동 래핑.

`main.ts:83`:
```ts
app.useGlobalInterceptors(new DbTimeInterceptor(), new ResponseFormatInterceptor());
```

---

## 8. Exception Filter — 에러 응답 통일

`main.ts:90`:
```ts
app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
```

`HttpExceptionFilter`:
```ts
// http-exception.filter.ts:4
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    sendErrorResponse(host, exception.getStatus(), exception.getResponse());
  }
}
```

> **순서 함정**: NestJS는 `useGlobalFilters` 배열을 reverse하고 first-match로 선택. **더 구체적인 필터(HttpExceptionFilter)를 뒤에** 등록해야 우선 매칭. `main.ts:90`은 일부러 그 순서.

→ 자세한 에러 흐름은 [14. 에러 흐름](./14-error-flow.md).

---

## 9. 요청 라이프사이클 (전체)

```
HTTP request
  ↓
[Express 미들웨어] helmet → compression → CORS → cookieParser → CSRF
  ↓
[Guard] JwtAuthGuard → RolesGuard → RequiredTermsGuard
  ↓
[Pipe] ValidationPipe / ZodValidationPipe (Param/Query/Body)
  ↓
[Interceptor before] DbTimeInterceptor → ResponseFormatInterceptor
  ↓
[Controller] handler 실행
  ↓
[Service] 비즈니스 로직
  ↓
[Repository] DB query
  ↓
[Interceptor after] 응답 가공 (success envelope)
  ↓
HTTP response
```

에러 발생 시: 어디서든 throw → **Exception Filter**가 가로채 `{ success: false, error, meta }`로 변환.

---

## 10. WARA에서 자주 쓰는 패턴

### 도메인 모듈 만들기
```
apps/api/src/photos/
├── photos.module.ts        # 모듈 정의
├── photos.controller.ts    # @Controller('photos')
├── photos.service.ts       # 비즈니스 로직
├── photos.repository.ts    # DB 접근
├── dto/                    # Zod 스키마 + 타입
└── photos.spec.ts          # 테스트
```

### 컨트롤러는 얇게
```ts
@Post()
upload(@Body(new ZodValidationPipe(Schema)) body: Dto, @Req() req) {
  return this.photosService.upload(req.user.id, body);
}
```

### 서비스에서 도메인 에러 throw
```ts
if (!photo) {
  throw new NotFoundException({ code: ErrorCode.PHOTO_NOT_FOUND, message: '...' });
}
```

---

## 11. 흔한 함정

### 모듈 import 빠뜨림
`AuthService`를 `PhotosService`에서 쓰려는데, `PhotosModule.imports`에 `AuthModule`이 없으면 → DI 에러로 부팅 실패.

### Circular dependency
ModuleA → ModuleB → ModuleA. `forwardRef()` 사용으로 풀 수 있지만, 설계가 잘못된 신호인 경우가 많음.

### `@Injectable()` 빠뜨림
`providers`에 등록했는데 클래스에 `@Injectable()` 안 붙임 → 런타임에 "Nest can't resolve dependencies" 에러.

### Service에서 직접 DB 호출
규칙: Repository 경유. 안 그러면 트랜잭션·로깅·테스트가 다 산만해짐.

---

## 12. 체크리스트

- [ ] Module/Controller/Service/Repository의 역할이 머리에 그려진다
- [ ] DI가 왜 좋은지 설명할 수 있다 (테스트·결합도)
- [ ] `@Global()`, `@Injectable()`, `APP_GUARD`가 뭔지 안다
- [ ] Pipe vs Guard vs Interceptor vs Filter의 차이를 안다
- [ ] 요청 라이프사이클(미들웨어 → 가드 → 파이프 → 인터셉터 → 핸들러 → 인터셉터 → 응답)을 그릴 수 있다

→ 다음: [04. Drizzle + PostgreSQL](./04-drizzle-postgres.md)
