---
name: swagger-review
description: >
  Use this skill to review Swagger/OpenAPI documentation, error response consistency,
  and HTTP status codes across all controllers.
  Triggers include: Swagger 점검, OpenAPI, 에러 응답 통일, 상태코드 점검, API 문서화, @ApiResponse,
  공통 에러 응답, swagger 최종 업데이트.
  Always verify that documented responses match actual controller/service behavior.
---

# Swagger / Error Response Review Skill (NestJS / WARA)

API 문서와 실제 동작이 일치하는지 검증한다.
Swagger 데코레이터가 실제 응답 형식을 정확히 반영하는지, 에러 코드가 표준화됐는지 확인한다.

---

## 원칙

- 문서화된 응답 코드와 실제 Service에서 throw하는 예외 코드가 일치해야 한다
- 에러 응답 형식은 `error-codes.md` 기준으로 통일돼야 한다
- `@ApiResponse`가 없는 엔드포인트는 클라이언트가 에러 처리를 추측해야 한다
- 성공 응답 DTO가 `@ApiProperty`로 문서화돼야 한다

---

## Workflow

### Phase 1 — Swagger 데코레이터 현황 스캔

```bash
# ApiResponse 데코레이터 적용 현황
grep -rn "@ApiResponse\|@ApiOperation\|@ApiTags\|@ApiBearerAuth" \
  apps/api/src/**/*.controller.ts

# Swagger 미적용 엔드포인트 탐색
grep -n "@Get\|@Post\|@Patch\|@Delete\|@Put" apps/api/src/**/*.controller.ts | \
  grep -v "spec.ts"
```

---

### Phase 2 — 에러 응답 일관성 검증

```bash
# 실제 throw하는 에러 코드 목록
grep -rn "throw new\|ErrorCode\." apps/api/src/**/*.service.ts

# Swagger에 문서화된 에러 코드 목록
grep -rn "@ApiResponse.*status" apps/api/src/**/*.controller.ts
```

각 엔드포인트에 대해 확인:
1. Service에서 throw하는 모든 예외 코드가 `@ApiResponse`에 있는가?
2. `@ApiResponse`에 선언된 코드가 실제로 발생 가능한 코드인가? (과대 문서화 방지)
3. 에러 응답 schema가 `{ success, error: { code, type, message }, meta }` 형식인가?

---

### Phase 3 — HTTP 상태코드 표준화

```bash
grep -rn "HttpStatus\|@HttpCode" apps/api/src/**/*.controller.ts
```

**체크 항목:**

| 케이스 | 올바른 상태코드 |
|--------|----------------|
| 생성 성공 | 201 |
| 조회/수정/삭제 성공 | 200 |
| 삭제 후 응답 없음 | 204 |
| 인증 실패 | 401 |
| 권한 없음 | 403 |
| 리소스 없음 | 404 |
| 중복 | 409 |
| 유효성 검증 실패 | 400 또는 422 |
| rate limit | 429 |
| 외부 서비스 오류 | 502/504 |

---

### Phase 4 — DTO 문서화 검증

```bash
grep -rn "@ApiProperty\|@ApiPropertyOptional" apps/api/src/**/*.dto.ts
```

**체크 항목:**

- [ ] 응답 DTO의 각 필드에 `@ApiProperty` 적용 여부
- [ ] `description`, `example` 값이 실제 데이터와 일치하는지
- [ ] optional 필드에 `@ApiPropertyOptional` 사용 여부
- [ ] enum 타입에 `enum` 옵션 명시 여부

---

### Phase 5 — main.ts Swagger 설정 검증

```bash
grep -n "SwaggerModule\|DocumentBuilder\|swagger" apps/api/src/main.ts
```

**체크 항목:**

- [ ] `SwaggerModule.setup()` 호출 위치가 적절한가? (프로덕션에서는 비활성화 권장)
- [ ] `DocumentBuilder`에 Bearer auth 설정이 있는가?
- [ ] API 버전, 타이틀, 설명이 명시됐는가?

---

## 출력 형식

```
## Swagger / 에러 응답 점검 결과

### Swagger 미적용 엔드포인트
| 컨트롤러 | 메서드 | 경로 | 누락 항목 |

### 에러 응답 불일치
| 엔드포인트 | Service 실제 에러 | Swagger 문서 에러 | 불일치 내용 |

### 상태코드 오류
| 엔드포인트 | 현재 코드 | 올바른 코드 | 이유 |

### 수정 완료
| # | 항목 | 수정 내용 | 검증 |

### 양호
| 항목 | 근거 |
```
