# WARA 보안 설계 최종 체크리스트

> 새 엔드포인트 구현 완료 후 PR 올리기 전 확인.
> ✅ 통과 / ❌ 미통과 / N/A 해당없음

---

## 1. 인증 / 인가

- [ ] 모든 엔드포인트에 Guard가 명시적으로 적용됐는가?
- [ ] Guard 적용 순서가 올바른가?
  > `JwtAuthGuard`(전역) → `BlocklistGuard` → `ParticipantGuard` → `HostGuard`
- [ ] `@Public()` 데코레이터가 꼭 필요한 엔드포인트에만 붙어 있는가?
- [ ] 인증 관련 엔드포인트(login, callback, refresh)에 `@Throttle`이 적용됐는가?
- [ ] OAuth callback DTO의 `state` 필드가 `optional()`이 아닌 required로 선언됐는가?
- [ ] 차단된 유저(blocklist)가 재가입하거나 리소스에 접근하는 경로가 없는가?

---

## 2. IDOR (Insecure Direct Object Reference)

- [ ] 리소스 단건 조회 시 `invitationId` 소속 검증이 있는가?
  > `photo.invitationId !== invitationId` 패턴
- [ ] Repository의 `findById` 계열 메서드가 단독으로 사용될 때 소속 검증이 Service에서 이루어지는가?
- [ ] 다른 초대장 ID로 요청해도 자신의 초대장 리소스만 반환되는가?

---

## 3. 비즈니스 로직

- [ ] 참가 요청(`join`) 시 blocklist 차단 여부를 먼저 확인하는가?
- [ ] 계정 삭제(`deleteMe`) 시 해당 userId의 refresh token이 전부 폐기되는가?
- [ ] PATCH/DELETE에서 요청자가 리소스 소유자인지 검증하는가?
  > `viewer.id !== participantId` 패턴
- [ ] check-then-act 패턴(조회 후 생성)에 DB unique constraint가 있어 race condition이 방지되는가?
- [ ] 마감(closed)/삭제(deletedAt) 상태 리소스에 대한 접근이 차단되는가?
- [ ] 예제·레퍼런스 모듈이 `app.module.ts`에 등록되지 않았는가?

---

## 4. 입력값 검증

- [ ] 모든 요청 body / query / params가 Zod 스키마로 검증되는가?
- [ ] ULID 정규식이 올바른 Crockford Base32 문자셋을 사용하는가?
  > `[0-9A-HJKMNP-TV-Z]` (I, L, O, U 제외)
- [ ] 로그나 응답에 echo되는 헤더 값(x-request-id 등)에 `\r\n` 필터와 길이 제한이 있는가?
- [ ] 파일명, 경로 등 외부 입력에서 path traversal 문자가 필터링되는가?
- [ ] 외부 스토리지(S3 등)에 저장되는 key/path 형식이 정규식으로 강제되는가?

---

## 5. 세션 / 토큰

- [ ] Refresh token이 DB에 해시로 저장되는가? (평문 금지)
- [ ] Refresh token rotation이 단일 쿼리(원자적)로 처리되는가?
- [ ] Access token 만료 시간이 적절한가? (기본값 30분 권장)
- [ ] 계정 삭제, 비밀번호 변경, 강제 로그아웃 시 모든 토큰이 폐기되는가?

---

## 6. Rate Limiting

- [ ] 인증 엔드포인트에 글로벌 rate limit보다 엄격한 전용 `@Throttle`이 적용됐는가?
  > 기본값: `{ ttl: 60000, limit: 10 }`
- [ ] 외부 API를 프록시하는 엔드포인트(카카오, 네이버 등)에 전용 `@Throttle`이 있는가?
- [ ] 파일 업로드, presigned URL 발급 등 비용이 큰 작업에 rate limit이 있는가?

---

## 7. 설정 / 인프라

- [ ] `app.use(helmet())`이 `main.ts`에 적용됐는가?
- [ ] CORS origin이 와일드카드(`*`)가 아닌 명시적 도메인인가?
- [ ] 필수 환경변수 누락 시 서버 시작이 실패하는가?
- [ ] 500 에러 응답 JSON에 stack trace가 포함되지 않는가?
  > 서버 로그에만 기록, 응답 body에는 포함 금지
- [ ] WebSocket 연결 시 JWT 검증 실패하면 즉시 `client.disconnect()`하는가?

---

## 현재 브랜치 적용 현황 (feat/security-audit 기준)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| OAuth CSRF (state required) | ✅ | apple-callback.dto, social-callback.dto |
| IDOR 다운로드 (invitationId 검증) | ✅ | photos.repository.ts |
| IDOR getPhoto | ✅ | photos.service.ts |
| IDOR toggleLike | ✅ | photos.service.ts |
| imageKey S3 경로 정규식 | ✅ | upload-photo.dto.ts (ULID 문자셋 포함) |
| ParticipantGuard 누락 (locations GET 2개) | ✅ | locations.controller.ts |
| ParticipantGuard 누락 (locations PUT) | ✅ | locations.controller.ts |
| ParticipantGuard 누락 (missions GET 2개) | ✅ | missions.controller.ts |
| Auth callback rate limit | ✅ | auth.controller.ts |
| 차단된 유저 재가입 | ✅ | participants.service.ts |
| deleteMe 시 refresh token 폐기 | ✅ | users.service.ts, users.repository.ts |
| participants-example 프로덕션 노출 | ✅ | app.module.ts |
| x-request-id log injection | ✅ | error-response.helper.ts |
| Kakao 검색 API rate limit | ✅ | locations-search.controller.ts |
| helmet 설치 | ✅ | main.ts |
| CORS wildcard | ✅ (N/A) | FRONTEND_URL 필수 검증으로 안전 |
| stack trace 응답 노출 | ✅ (N/A) | logger에만 기록, 응답 body 미포함 |
| WebSocket JWT 검증 | ✅ (N/A) | disconnect() 처리 확인 |
