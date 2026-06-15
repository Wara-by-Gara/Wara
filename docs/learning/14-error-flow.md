# 14. 에러 흐름

> 에러 코드 1개가 정의되는 순간부터 클라이언트의 UI에 메시지로 표시될 때까지.

---

## 1. 응답 형식 (계약)

성공:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```

실패:
```json
{
  "success": false,
  "error": {
    "code": "PHOTO_NOT_FOUND",
    "type": "not_found",
    "message": "사진을 찾을 수 없습니다",
    "details": { ... }
  },
  "meta": { "requestId": "uuid", "timestamp": "..." }
}
```

- **`code`**: 도메인 코드 (이 문서의 핵심)
- **`type`**: HTTP status 그룹 (`authentication`, `not_found`, `conflict` 등 — 클라이언트가 대분류 처리에 사용)
- **`message`**: 사람이 읽는 메시지 (현재는 code와 같은 값이 들어오는 경우가 많음)
- **`details`**: 검증 실패 등 부가 정보 (optional)

---

## 2. 단계 0 — `ErrorCode` 상수 정의

`apps/api/src/common/constants/error-codes.ts`:
```ts
export const ErrorCode = {
  AUTH_INVALID_STATE:        'AUTH_INVALID_STATE',
  PHOTO_NOT_FOUND:           'PHOTO_NOT_FOUND',
  INVITATION_VERSION_CONFLICT: 'INVITATION_VERSION_CONFLICT',
  // ... 100개+
} as const;
```

### 규칙 (루트 CLAUDE.md)
- 새 기능 구현 시 에러는 반드시 이 파일에 추가 후 사용
- 문자열 직접 사용 금지 (`throw new ... { code: 'PHOTO_NOT_FOUND' }` ❌)
- `docs/conventions/error-codes.md` 표에 항목 추가

### 코드 네이밍
- `<도메인>_<상황>` (예: `PHOTO_DUPLICATE`, `AUTH_INVALID_STATE`)
- 모두 대문자 + underscore
- `[A-Z][A-Z0-9_]+` 정규식 통과 (helper가 검증)

---

## 3. 단계 1 — Service에서 throw

`apps/api/CLAUDE.md` 규칙:
- 에러는 **Service에서** domain 단위로 발생
- Controller는 HTTP 응답 형태로 변환만 (보통 그냥 통과)

예 (photo 조회):
```ts
@Injectable()
export class PhotosService {
  async getPhoto(id: string, userId: string) {
    const photo = await this.repo.findById(id);
    if (!photo) {
      throw new NotFoundException({
        code: ErrorCode.PHOTO_NOT_FOUND,
        message: '사진을 찾을 수 없습니다',
      });
    }
    if (photo.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.PHOTO_FORBIDDEN,
        message: '본인 사진이 아닙니다',
      });
    }
    return photo;
  }
}
```

### 왜 NestJS 기본 Exception을 쓰나
- `NotFoundException` → 404, `BadRequestException` → 400 등 status 매핑이 자동
- `getResponse()`에 우리가 넣은 `{ code, message, details }`가 그대로 들어감

### details 활용 (검증 에러)
```ts
throw new BadRequestException({
  code: ErrorCode.VALIDATION_ERROR,
  message: '검증 실패',
  details: { field: 'email', reason: 'invalid format' },
});
```

---

## 4. 단계 2 — Exception Filter가 가로채

`main.ts:90`:
```ts
app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
```

> NestJS는 `useGlobalFilters` 배열을 reverse 후 first-match — **더 구체적인 필터(HttpExceptionFilter)를 뒤에** 등록.

### `HttpExceptionFilter` (구체)
`apps/api/src/common/filters/http-exception.filter.ts:4`:
```ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    sendErrorResponse(host, exception.getStatus(), exception.getResponse());
  }
}
```
- `NotFoundException`, `BadRequestException` 등은 다 `HttpException`의 자식 → 여기서 처리

### `AllExceptionsFilter` (catch-all)
`apps/api/src/common/filters/all-exceptions.filter.ts:5`:
```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) Sentry.captureException(exception);

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    sendErrorResponse(host, status, raw, exception instanceof Error ? exception.stack : undefined);
  }
}
```
- TypeError 같은 예상 못한 에러도 받아냄
- 5xx면 Sentry 전송

---

## 5. 단계 3 — `sendErrorResponse` helper

`error-response.helper.ts:109`:
```ts
export function sendErrorResponse(host, status, raw, stack?): void {
  const ctx = host.switchToHttp();
  const request = ctx.getRequest<Request>();
  const response = ctx.getResponse<Response>();
  const requestId = resolveRequestId(request);

  const code = pickCode(raw, status);
  const type = statusToType(status);
  const message = pickMessage(raw, status);
  const details = extractRawDetails(raw);

  if (status >= 500) logger.error(`[${requestId}] ${method} ${url} → ${status} ${code}: ${message}`, stack);
  else if (status >= 400) logger.warn(`[${requestId}] ${method} ${url} → ${status} ${code}`);

  response.status(status).json({
    success: false,
    error: { code, type, message, ...(details !== undefined && { details }) },
    meta: { requestId, timestamp: new Date().toISOString() },
  });
}
```

### `pickCode`
`error-response.helper.ts:77`:
```ts
function pickCode(raw, status): string {
  const message = extractRawMessage(raw);
  if (typeof message === 'string' && CODE_PATTERN.test(message)) return message;   // (1)
  if (raw && typeof raw === 'object' && 'code' in raw) {                            // (2)
    const code = raw.code;
    if (typeof code === 'string' && CODE_PATTERN.test(code)) return code;
  }
  return statusToDefaultCode(status);                                                // (3)
}
```
1. `throw new BadRequestException('VALIDATION_ERROR')` 처럼 string으로 던진 경우 — `message` 자리에 코드가 들어옴
2. `{ code: 'XXX', message: '...' }` 객체로 던진 경우 (권장)
3. 아무것도 안 맞으면 status 기반 fallback (`INVALID_REQUEST`, `UNAUTHENTICATED`, ...)

### `statusToType`
HTTP status를 8개 그룹으로 매핑 — 클라이언트가 status 직접 안 봐도 type만 보고 분기 가능.

### `resolveRequestId`
- 우선순위: `req.id` (pino-http) → `x-request-id` 헤더 echo → 새 UUID
- 응답의 `meta.requestId`와 로그의 prefix가 같은 값을 가져 → **로그 추적 가능**

---

## 6. 단계 4 — 로깅

`error-response.helper.ts:125`:
```ts
if (status >= 500) {
  logger.error(`[${requestId}] ${method} ${url} → ${status} ${code}: ${message}`, stack);
} else if (status >= 400) {
  logger.warn(`[${requestId}] ${method} ${url} → ${status} ${code}`);
}
```

- 4xx는 warn (사용자 실수가 다수)
- 5xx는 error + stack
- requestId가 prefix → 같은 요청의 모든 로그를 grep 가능

---

## 7. 단계 5 — 클라이언트 (`apiClient`)

`apps/web/src/lib/api-client.ts:30`:
```ts
const json = await res.json();
if (!json.success) {
  throw new ApiError(json.error.code, json.error.type, json.error.message, json.error.details);
}
return json.data as T;
```

→ 호출 측은 `try / catch (e instanceof ApiError)`로 받음.

---

## 8. 단계 6 — UI 표시

`apps/web/CLAUDE.md` 패턴:
```ts
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_STATE: '로그인을 다시 시도해주세요',
  PHOTO_NOT_FOUND:    '사진을 찾을 수 없습니다',
  // ...
};

useMutation({
  mutationFn: ...,
  onError: (e) => {
    const code = e instanceof Error ? e.message : '';
    setSubmitError(ERROR_MESSAGES[code] ?? '오류가 발생했습니다');
  },
});

{submitError && <p className="text-sm text-red-500">{submitError}</p>}
```

### 왜 코드 그대로 안 보여주나
- 사용자에게 `AUTH_INVALID_STATE`를 보여줘봐야 의미 없음
- 코드 → 사람 메시지 변환 테이블을 프론트에서 관리
- 미정의 코드는 "오류가 발생했습니다" fallback

---

## 9. 자주 보는 에러 코드 표 (요약)

전체는 `docs/conventions/error-codes.md`. 일부:

| 코드 | status | 상황 |
|---|---|---|
| `AUTH_INVALID_STATE` | 401 | OAuth state 위조/만료 |
| `TOKEN_INVALID` | 401 | refresh token 위조/없음 |
| `TOKEN_EXPIRED` | 401 | refresh token 만료 |
| `SUSPICIOUS_REFRESH` | 401 | revoked refresh 재사용 |
| `CSRF_INVALID_ORIGIN` | 403 | 쿠키 요청 Origin 불일치 |
| `INSUFFICIENT_ROLE` | 403 | 가드 요구 role 미달 |
| `INVITATION_NOT_FOUND` | 404 | 초대장 없음/접근 권한 X |
| `INVITATION_CLOSED` | 422 | 마감된 초대장 변경 시도 |
| `INVITATION_VERSION_CONFLICT` | 409 | 낙관적 락 충돌 |
| `IDEMPOTENCY_IN_PROGRESS` | 409 | 같은 키 요청 처리 중 |
| `PHOTO_TOO_LARGE` | 413 | 10MB 초과 |
| `AI_DAILY_LIMIT_EXCEEDED` | 429 | 일일 3회 초과 |
| `AI_TIMEOUT` | 504 | OpenAI 60초 timeout |
| `AI_SERVICE_UNAVAILABLE` | 503 | 서킷 open |
| `VALIDATION_ERROR` | 400 | DTO 검증 실패 (details에 필드별) |

---

## 10. 새 에러 코드 추가 절차

루트 CLAUDE.md 규칙:
1. `apps/api/src/common/constants/error-codes.ts`에 상수 추가
2. `docs/conventions/error-codes.md`에 항목 추가 (코드 표)
3. 서비스에서 `ErrorCode.XXX` 형태로 사용
4. (필요시) 프론트의 `ERROR_MESSAGES` 매핑에 사용자용 문구 추가

---

## 11. 흔한 함정

### 5xx에 Sentry 안 가는 경우
- HttpExceptionFilter가 먼저 잡아버리면 Sentry 안 감
- 5xx는 보통 `InternalServerErrorException`이나 raw error → AllExceptionsFilter가 잡음 → Sentry 전송

### CODE_PATTERN 안 맞는 코드
- 소문자/공백 들어가면 fallback `INVALID_REQUEST` 등으로 변환
- 정의된 코드인데도 응답에 안 나가면 패턴 확인

### `details`가 응답에 안 들어감
- `extractRawDetails`는 `raw.details`만 봄
- `throw new X({ details: ... })` 형태로 넣어야 함

### Service ↔ Service 직접 호출 시 에러 변환 안 됨
- A 서비스가 B 서비스를 직접 부르고 그 에러를 그대로 throw → B의 도메인 에러가 A 컨텍스트로 새어 나감
- → 서비스 간 호출 금지가 그 이유 (루트 CLAUDE.md)

---

## 12. 체크리스트

- [ ] 에러 응답 envelope의 4개 필드(code/type/message/details)를 안다
- [ ] `HttpExceptionFilter`와 `AllExceptionsFilter`의 역할 분담을 안다
- [ ] `pickCode`가 (1) string throw (2) object throw (3) fallback 순으로 처리하는 걸 안다
- [ ] requestId가 로그 prefix + 응답 meta로 동일하다는 걸 안다
- [ ] 클라이언트에서 `ApiError` → `ERROR_MESSAGES` 변환 패턴을 안다

→ 다음: [15. 테스트 전략](./15-testing.md)
