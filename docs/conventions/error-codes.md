# 에러 코드 목록

> 에러 응답 형식
> ```json
> {
>   "success": false,
>   "statusCode": 401,
>   "error": {
>     "code": "AUTH_INVALID_STATE",
>     "message": "유효하지 않은 state입니다.",
>     "details": {}
>   }
> }
> ```
> `details`는 DTO 검증 실패 시 필드별 오류 정보를 담을 때 사용 (optional)

---

## Auth

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `AUTH_INVALID_STATE` | 401 | state 위조 또는 만료 |
| `AUTH_INVALID_TOKEN` | 401 | id_token 위조 또는 만료 |
| `AUTH_USER_NOT_FOUND` | 401 | 유저 조회 실패 |
| `TOKEN_EXPIRED` | 401 | refresh token 만료 |
| `TOKEN_INVALID` | 401 | refresh token 위조 또는 없음 |
| `APPLE_SERVER_TIMEOUT` | 504 | Apple 인증 서버 응답 시간 초과 |

## Common

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `DB_TRANSACTION_FAILED` | 500 | DB 트랜잭션 실패 |

---

## 규칙

- 새 기능 구현 시 발생하는 에러는 반드시 `error-codes.ts`에 추가 후 사용
- 에러 메시지 문자열 직접 사용 금지

## 새 에러 코드 추가 방법

1. `apps/api/src/common/constants/error-codes.ts`에 상수 추가
2. 이 문서에 항목 추가
3. 서비스에서 `ErrorCode.XXX` 형태로 사용
