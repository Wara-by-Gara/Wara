# 20. 작은 패턴 모음

> 한 챕터로 묶기에는 작지만 알아두면 가치 큰 패턴들.

---

## 1. ULID vs UUID

### 왜 WARA는 ULID인가
`users.ts:6`:
```ts
id: text('id').primaryKey().$defaultFn(() => ulid())
```

| | UUID v4 | ULID |
|---|---|---|
| 길이 | 36자 (`xxxx-xxxx-...`) | 26자 (`01HZ...`) |
| 정렬 | **시간순 정렬 X** | **시간순 정렬 ✓** (앞 48bit = ms timestamp) |
| 인덱스 | 무작위 → B-Tree 페이지 분산 | 시간순 → B-Tree 페이지 지역성 |
| 보안 | 완전 무작위 | ms + random — 동시 생성 충돌 안전 |

### B-Tree 지역성이 왜 중요?
- UUID v4는 새 INSERT마다 인덱스의 무작위 위치에 들어감 → 페이지 split 빈번
- ULID는 항상 인덱스 끝에 추가 → cache hit율 높음, write 부하 낮음

### 단점
- 시간 정보가 노출됨 (보안 민감하면 부적합)
- 라이브러리 의존 (`ulid` 패키지)

### 클라이언트 측 생성
`$defaultFn(() => ulid())` → INSERT 전 ID를 미리 알 수 있음. RETURNING 없이도 응답에 포함.

---

## 2. Idempotency-Key 패턴

### 문제
"결제하기" 버튼 누르고 네트워크가 느려서 한 번 더 눌렀다 → 결제 2번?

### 해결
클라이언트가 요청에 `Idempotency-Key: <uuid>` 헤더 추가.
같은 키로 재전송 시 서버는 **첫 처리 결과를 그대로 재사용**.

### WARA 구현 (`apps/api/src/idempotency/idempotency.interceptor.ts:28`)
```ts
if (cached === 'in_progress') {
  throw new ConflictException(ErrorCode.IDEMPOTENCY_IN_PROGRESS);
}
if (cached) {
  res.status(cached.status);
  res.setHeader(IDEMPOTENCY_REPLAYED_HEADER, 'true');
  return of(cached.body);
}
// ... 락 잡고 처리
```

### 클라이언트
```ts
fetch('/api/payment', {
  method: 'POST',
  headers: { 'Idempotency-Key': uuid() },
  body: JSON.stringify({...}),
});
```

### 키 생성 책임은 누가?
- **클라이언트**가 생성 (재시도해도 같은 키)
- 서버가 생성하면 매 요청마다 다른 키 → idempotency 의미 없음

### TTL
WARA는 캐시 TTL을 길게(예: 24시간) — 같은 키로 한참 후엔 다시 새 처리. 정책에 따라 조정.

→ [17. Redis & BullMQ](./17-redis-bullmq-deep.md)의 9번 참조.

---

## 3. Zod vs class-validator

WARA는 **둘 다** 씀.

### class-validator (NestJS 기본)
```ts
export class CreateUserDto {
  @IsString() @Length(2, 20)
  nickname: string;

  @IsEmail()
  email: string;
}
```
- `main.ts:72`의 글로벌 `ValidationPipe`가 자동 적용
- 데코레이터 기반, NestJS 기본 통합

### Zod (스키마 기반)
```ts
export const CreateUserSchema = z.object({
  nickname: z.string().min(2).max(20),
  email: z.string().email(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// 사용
@Post()
create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto) {}
```

### 왜 Zod도 함께?
- **Drizzle 스키마와 타입 공유**: Zod 스키마에서 `infer`로 타입 추출 → 별도 클래스 정의 불필요
- **프론트엔드와 공유 가능**: Zod는 백/프론트 모두 사용
- **Discriminated union 같은 고급 타입** 표현이 쉬움

### 언제 무엇을?
- **간단한 DTO**: class-validator (적은 보일러플레이트)
- **복잡한 스키마, 타입 공유**: Zod
- WARA는 새 코드에선 Zod 쪽 비중이 늘어나는 추세

---

## 4. Pino 구조화 로깅 + Request ID

### console.log 금지 (루트 CLAUDE.md)
```ts
// ❌
console.log('user logged in', userId);

// ✅
this.logger.log({ event: 'login', userId }, 'User logged in');
```

### 왜 구조화?
- 운영 로그를 grep할 때 JSON 필드 추출이 쉬움
- CloudWatch / Datadog에서 인덱싱 가능

### nestjs-pino
`app.module.ts:50`:
```ts
LoggerModule,   // nestjs-pino
```
- 운영: JSON 출력
- 개발: `pino-pretty`로 사람 친화적 색상 출력

### Request ID 추적
- pino-http가 매 요청에 `req.id` 부여
- `resolveRequestId(request)`이 우선순위로 추출 (`error-response.helper.ts:102`):
  1. `req.id` (pino)
  2. `x-request-id` 헤더 echo
  3. 새 UUID
- 응답 `meta.requestId` + 로그 prefix가 같은 값 → **한 요청의 모든 흔적을 grep으로 추적 가능**

### X-DB-Time / X-DB-Query-Count
`DbTimeInterceptor`가 dev 환경에서 응답 헤더에 DB 시간·쿼리 수 노출:
```bash
curl -I http://localhost:3001/api/...
X-DB-Time: 12.4
X-DB-Query-Count: 3
```
- 브라우저 콘솔/네트워크 패널에서 바로 확인
- k6 부하 테스트가 이걸로 DB 시간만 분리 측정 → 16번 챕터 참조

---

## 5. Sentry 자동 계측

### Init 시점이 중요
`main.ts:3`:
```ts
import './sentry/instrument';   // ← 첫 줄
import { NestFactory } from '@nestjs/core';
```

→ **다른 모든 import보다 먼저** Sentry init이 실행되어야 자동 계측이 동작.
nest-internal 모듈들이 import 시점에 wrap되기 때문.

### 조건부 init
```ts
// apps/api/src/sentry/instrument.ts
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({...});
}
```
- dev에서는 no-op (시끄러운 노이즈 방지)
- DSN 없으면 no-op (실수로 publish 안 됨)

### 자동 보고 대상
`AllExceptionsFilter`가 5xx만 Sentry로:
```ts
// all-exceptions.filter.ts:13
if (status >= 500) Sentry.captureException(exception);
```
4xx는 사용자 실수가 다수 → Sentry 누락 (의도).

---

## 6. 약관 SoT — Markdown → DB seed

### 문제
약관 본문이 코드와 DB에 흩어져 있으면 동기화 망함.

### WARA의 해결
`docs/legal/*.md` 6개 (service, privacy, marketing, location, analytics, age)가 **단일 진실의 원천(SoT)**.

각 파일 형식:
```markdown
---
type: privacy
version: 1.2
isRequired: true
effectiveDate: 2026-05-01
---

# 개인정보 처리방침

본 약관은 ...
```

### Seed 동기화
`apps/api/drizzle/seed/seed-essential.ts`:
- 마크다운 파일 frontmatter 파싱 (`gray-matter`)
- `terms` 테이블에 `onConflictDoUpdate`로 자동 동기화
- 같은 (type, version) 조합이면 업데이트, 없으면 INSERT

### 운영 갱신
1. `docs/legal/privacy.md` 본문 수정 + frontmatter `version` 증가
2. `pnpm db:seed:essential` 실행 → DB 반영
3. 자동으로 신규 버전이 사용자에게 동의 요청 발송

---

## 7. Soft delete 패턴

### 규칙 (루트 CLAUDE.md)
> Soft delete 우선 (hard delete 금지)

### 구현
모든 도메인 테이블에 `deletedAt: timestamp(...)` 컬럼.

### 조회 시 필터
```ts
db.select().from(invitations).where(isNull(invitations.deletedAt));
```

### Partial unique index와의 시너지
`photos.ts:28`:
```ts
uniqueIndex('uq_photos_invitation_fingerprint')
  .on(t.invitationId, t.exifFingerprint)
  .where(isNull(t.deletedAt))
```
- soft delete된 row는 unique 제약에서 제외
- 같은 사진을 삭제 후 다시 업로드 가능 (UX 부드러움)

### 왜 soft delete?
- 실수로 삭제한 데이터 복구
- 통계·분석에 과거 데이터 활용
- 외래키 cascade로 의도치 않은 데이터 손실 방지

### 단점
- 모든 query에 `isNull(deletedAt)` 추가 필요 (반복)
- 디스크 점유 영원히

---

## 8. 글로벌 Throttler — Rate Limit

`app.module.ts:67`:
```ts
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: process.env.NODE_ENV !== 'production' ? 10000 : 60
}]),
```
- prod: 1분에 60회 / IP
- dev: 1분에 10000회 (개발·부하 테스트 편의)

### 메서드별 추가 제한
`auth.controller.ts:174`:
```ts
@Throttle({ default: { ttl: 60000, limit: 10 } })
mobileTokenLogin(...) {}
```
- 로그인은 brute force 방어로 더 엄격

### `UserThrottlerGuard`
`app.module.ts:102`:
```ts
{ provide: APP_GUARD, useClass: UserThrottlerGuard },
```
- IP 단위가 아닌 **user 단위** 카운트
- 같은 IP의 여러 계정 차단 회피 방지

---

## 9. 응답 envelope — 통일된 계약

### 성공
```json
{ "success": true, "data": ..., "meta": { "requestId", "timestamp" } }
```

### 실패
```json
{ "success": false, "error": { "code", "type", "message", "details" }, "meta": ... }
```

### 자동화
- 성공: `ResponseFormatInterceptor` (`main.ts:83`)
- 실패: `HttpExceptionFilter` + `AllExceptionsFilter` (`main.ts:90`)

서비스가 반환 또는 throw만 하면 자동 변환.

### 클라이언트 측 unwrap
`apps/web/src/lib/api-client.ts:30`:
```ts
if (!json.success) throw new ApiError(json.error.code, ...);
return json.data as T;
```
- 호출 측은 `T`만 다룸
- 성공/실패 분기 한 곳에서

→ [14. 에러 흐름](./14-error-flow.md)에서 더.

---

## 10. CORS exposedHeaders (dev only)

`main.ts:64`:
```ts
app.enableCors({
  origin: process.env.FRONTEND_URL?.replace(/\/$/, ''),
  credentials: true,
  exposedHeaders: process.env.NODE_ENV !== 'production'
    ? ['X-DB-Time', 'X-DB-Query-Count']
    : [],
});
```

### 왜 prod엔 안 노출?
- 디버깅 정보 노출 = 보안 표면 증가
- 운영에선 클라이언트가 알 필요 없음

### 왜 dev엔 노출?
- 브라우저 콘솔/네트워크 패널에서 즉시 확인
- k6 같은 부하 도구가 헤더로 측정 가능

---

## 11. 환경별 모듈 조건부 로드

`app.module.ts:72`:
```ts
...(process.env.NODE_ENV !== 'production' ? [DevAuthModule] : []),
AuthModule,
```
- `/auth/dev/token` 같은 백도어 라우트는 dev 전용
- prod 빌드 시 import 자체가 제외 → 코드도 들어가지 않음

### 순서 함정
`AuthController`의 `@Post(':provider/token')` 와일드카드가 `/auth/dev/token`을 가로채지 않게 → DevAuthModule을 **AuthModule보다 먼저** 등록.
NestJS는 imports 순서대로 controller 등록.

---

## 12. 체크리스트

- [ ] ULID와 UUID의 인덱스 friendliness 차이를 안다
- [ ] Idempotency-Key 헤더 책임이 클라이언트에 있다는 걸 안다
- [ ] Zod와 class-validator를 언제 각각 쓸지 안다
- [ ] requestId가 로그·응답·DB-Time 헤더로 연결되는 흐름을 안다
- [ ] Sentry init이 첫 import여야 하는 이유를 안다
- [ ] 약관 markdown SoT + seed onConflictDoUpdate 흐름을 안다
- [ ] partial unique index가 soft delete와 어떻게 시너지인지 안다

→ 다음: [21. 거버넌스 & 의사결정](./21-governance.md)
