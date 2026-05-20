# WARA Swagger / 에러 응답 최종 체크리스트

> 새 엔드포인트 구현 완료 후 PR 올리기 전 확인.
> ✅ 통과 / ❌ 미통과 / N/A 해당없음

---

## 1. Swagger 기본 설정

- [ ] `main.ts`에 `SwaggerModule.setup()` 설정이 있는가?
- [ ] `DocumentBuilder`에 타이틀, 버전, 설명이 명시됐는가?
- [ ] `@ApiBearerAuth()` 설정이 있어 인증 토큰 테스트가 가능한가?
- [ ] Swagger UI 경로가 프로덕션에서 적절히 관리되는가? (비공개 또는 조건부 노출)

---

## 2. 컨트롤러 데코레이터

- [ ] 모든 컨트롤러에 `@ApiTags()`가 적용됐는가?
- [ ] 모든 엔드포인트에 `@ApiOperation({ summary })` 이 있는가?
- [ ] 인증이 필요한 엔드포인트에 `@ApiBearerAuth()` 가 있는가?

---

## 3. 성공 응답 문서화

- [ ] 각 엔드포인트에 성공 시 `@ApiResponse({ status: 2xx })` 가 있는가?
- [ ] 응답 DTO가 `type` 또는 `schema`로 명시됐는가?
- [ ] 응답 DTO 필드에 `@ApiProperty` 가 적용됐는가?

---

## 4. 에러 응답 문서화

- [ ] Service에서 throw하는 모든 예외에 대응하는 `@ApiResponse`가 있는가?
- [ ] 에러 응답 형식이 `{ success, error: { code, type, message }, meta }` 인가?
- [ ] `error-codes.md`에 정의된 코드만 사용하는가?
- [ ] 공통 에러(401, 403, 404, 429)가 중복 없이 표준화됐는가?

---

## 5. HTTP 상태코드 표준화

- [ ] POST(생성) → 201 반환하는가?
- [ ] GET/PATCH → 200 반환하는가?
- [ ] DELETE → 200 또는 204 반환하는가?
- [ ] 인증 실패 → 401 (403 아님)
- [ ] 권한 없음 → 403 (401 아님)
- [ ] 중복 리소스 → 409
- [ ] 유효성 실패 → 400 (DTO 검증) 또는 422 (비즈니스 규칙)
- [ ] Rate limit 초과 → 429
- [ ] 외부 서비스 타임아웃 → 504

---

## 6. 에러 코드 일관성

- [ ] 새 에러 코드가 `error-codes.ts` 상수에 추가됐는가?
- [ ] 새 에러 코드가 `error-codes.md` 문서에 추가됐는가?
- [ ] 문자열 직접 throw 없이 `ErrorCode.XXX` 상수만 사용하는가?
- [ ] 같은 상황에 다른 에러 코드가 쓰이지 않는가? (중복/혼용 금지)

---

## 현재 브랜치 적용 현황 (feat/swagger-errors 기준)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| @nestjs/swagger 패키지 설치 | ⚠️ | 확인 필요 |
| main.ts Swagger 설정 | ⚠️ | WIP stash 상태 |
| auth controller @ApiResponse | ⚠️ | WIP 변경 중 |
| invitations controller @ApiResponse | ⚠️ | WIP 변경 중 |
| missions controller @ApiResponse | ⚠️ | WIP 변경 중 |
| notifications controller @ApiResponse | ⚠️ | WIP 변경 중 |
| participants controller @ApiResponse | ⚠️ | WIP 변경 중 |
| photos controller @ApiResponse | ⚠️ | WIP 변경 중 |
| error-codes.ts 신규 코드 추가 | ⚠️ | 확인 필요 |
| HTTP 상태코드 표준화 | ⚠️ | 확인 필요 |
