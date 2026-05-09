---
name: api-design
description: >
  Use this skill whenever the user wants to design, build, or review a REST API with NestJS.
  Triggers include: API 설계, REST API, 엔드포인트 설계, 라우팅 구조, API 버전 관리,
  요청/응답 형식, 에러 처리, HTTP 상태코드, 인증 (JWT, API Key, OAuth),
  페이지네이션, Rate Limiting, 멱등성, OpenAPI, Swagger, API 문서화,
  NestJS controller, NestJS guard, NestJS pipe, NestJS interceptor, NestJS module 작성.
  ESPECIALLY use when the user shares a Drizzle schema, DB schema, or table definitions
  and wants to derive API endpoints from it — this is the primary use case.
  This skill MUST be used even for simple requests like "user 조회 API 만들어줘" or "이 스키마로 API 만들어줘".
  Always apply RESTful conventions, consistent error format, Zod validation, and NestJS best practices.
---

# API Design Skill (NestJS)

Production-ready REST API 설계 + NestJS TypeScript 코드 생성.
DB 스키마(Drizzle)를 입력받아 엔드포인트를 도출하고, RESTful 원칙, 에러 핸들링, 인증, 페이지네이션, Rate Limiting, 멱등성까지 고려한다.
**모든 코드는 NestJS 기준으로 작성한다.**

---

## Workflow

### Phase 0 — DB 스키마 분석 (스키마가 주어진 경우 반드시 먼저 실행)

스키마가 제공되면 코드를 바로 쓰지 말고, 아래 분석을 먼저 수행한다.
분석 결과를 **엔드포인트 설계 테이블**로 정리해 사용자에게 확인받은 후 Phase 1로 넘어간다.

#### 0-1. 테이블 분류

스키마의 모든 테이블을 아래 세 가지로 분류한다:

| 분류 | 기준 | API 처리 방식 |
|------|------|-------------|
| **독립 리소스** | 다른 테이블의 FK 없이 단독 존재 가능 (users, products 등) | 독립 Controller |
| **종속 리소스** | 부모 FK가 필수이며 부모 없이 의미 없음 (comments → posts) | 중첩 라우트 또는 부모 Controller에 통합 |
| **연결 테이블** | N:M 중간 테이블 (post_tags, user_roles 등) | 부모 리소스의 관계 엔드포인트 |

#### 0-2. 컬럼 시그널 읽기

컬럼 이름과 타입에서 API 동작을 결정하는 시그널을 추출한다:

```
deletedAt  → soft delete 테이블. DELETE는 실제 삭제가 아닌 deletedAt 세팅.
             GET 목록에서 기본적으로 deletedAt IS NULL 필터 적용.

status (enum) → 상태 전이 엔드포인트 필요.
                PATCH /:id/status 또는 PATCH /:id (status 필드 포함) 여부 결정.

version (int) → 낙관적 락 적용. PATCH/PUT 요청 body에 version 필드 필수.

password / hashedPassword / secret / token → 응답에서 절대 노출 금지.
                                             Response DTO에서 제외.

createdAt / updatedAt / deletedAt → 읽기 전용. Create/Update DTO에서 제외.

metadata (jsonb) → Create DTO에는 optional object,
                   Update DTO에는 deep merge 여부 결정 필요.

organizationId / tenantId → 멀티 테넌시. URL이 아닌 JWT에서 추출.
                            쿼리/바디에서 받지 않는다.

parentId (self-join) → 계층 구조. GET /?parentId=xxx 필터 추가.
```

#### 0-3. 관계 유형별 엔드포인트 결정

관계 유형에 따라 URL 구조를 결정한다.
**심화 패턴은 `references/schema-to-endpoints.md`를 참조한다.**

```
1:N (posts → comments)
  댓글이 독립적으로 조회될 일이 없다면  → GET /posts/:postId/comments
  댓글을 독립적으로 조회할 일이 있다면  → GET /comments?postId=xxx

N:M (posts ↔ tags via post_tags)
  태그 연결/해제               → POST   /posts/:postId/tags/:tagId
                                 DELETE /posts/:postId/tags/:tagId
  연결된 태그 목록             → GET    /posts/:postId/tags

상태 전이 (order.status)
  단순 상태 변경              → PATCH /orders/:id  { status: "shipped" }
  복잡한 비즈니스 로직 포함   → POST  /orders/:id/cancel
                                 POST  /orders/:id/ship
```

#### 0-4. 엔드포인트 설계 테이블 출력

분석 후 아래 형식으로 정리해 **사용자에게 확인을 받는다**:

```
| Method | Path                        | 설명              | 인증 | 비고                    |
|--------|-----------------------------|-------------------|------|-------------------------|
| GET    | /users                      | 유저 목록          | ✅   | 페이지네이션             |
| GET    | /users/:id                  | 유저 단건          | ✅   |                         |
| POST   | /users                      | 유저 생성          | ❌   | 회원가입                 |
| PATCH  | /users/:id                  | 유저 수정          | ✅   | 본인만 가능              |
| DELETE | /users/:id                  | 유저 탈퇴          | ✅   | soft delete (deletedAt) |
| GET    | /posts                      | 게시글 목록        | ❌   |                         |
| POST   | /posts/:postId/tags/:tagId  | 태그 연결          | ✅   | N:M 연결                 |
```

확인 후 → Phase 1로 진행

---

### Phase 1 — 설계 리뷰

코드 작성 전, 반드시 아래 순서로 API 구조를 다듬는다.

#### 1-1. 리소스 & 엔드포인트 파악

- 어떤 리소스(Resource)가 필요한지 목록화
- 각 리소스에 필요한 CRUD 작업 확인
- 리소스 간 관계(중첩 라우팅 여부) 결정

**URL 설계 원칙**: 명사 복수형 소문자 kebab-case, 동사 금지, 중첩은 소유 관계 명확할 때만 1단계까지.

#### 1-2. HTTP 메서드 & 상태코드 매핑

| 작업 | 메서드 | 성공 | 실패 |
|------|--------|------|------|
| 목록 조회 | GET | 200 | 400, 404 |
| 단건 조회 | GET | 200 | 404 |
| 생성 | POST | 201 + Location 헤더 | 400, 409 |
| 전체 수정 | PUT | 200 | 400, 404 |
| 부분 수정 | PATCH | 200 | 400, 404 |
| 삭제 | DELETE | 204 (no body) | 404 |
| 인증 필요 | any | — | 401 |
| 권한 없음 | any | — | 403 |
| 서버 오류 | any | — | 500 |

#### 1-3. 응답 형식 통일

모든 응답은 **Envelope 패턴**으로 통일한다:

- 성공: `{ success: true, data: ... }` — 목록은 `meta: { total, page, limit, totalPages }` 추가
- 에러: `{ success: false, error: { code, message, details? } }` — `code`는 기계용, `message`는 사람용

> ⚠️ 일관성 없는 형식(`{ status: "error", msg: "..." }`) 절대 금지.

#### 1-4. API 버전 관리 전략

URL 경로 방식 권장(`/api/v1/users`). 쿼리 파라미터 방식 비권장.

설계 리뷰 후 **"이렇게 이해했습니다" 엔드포인트 테이블**을 보여주고 확인받은 뒤 코드로 넘어간다.

---

### Phase 2 — 코드 작성

#### NestJS 모듈 파일 구조 (도메인 기반)

```
src/
├── common/
│   ├── filters/global-exception.filter.ts
│   ├── guards/jwt-auth.guard.ts, roles.guard.ts
│   ├── interceptors/response.interceptor.ts
│   ├── pipes/zod-validation.pipe.ts
│   ├── decorators/current-user.decorator.ts, roles.decorator.ts
│   └── types/api.types.ts
├── {domain}/
│   ├── {domain}.module.ts
│   ├── {domain}.controller.ts
│   ├── {domain}.service.ts
│   └── dto/create.dto.ts, update.dto.ts, list.dto.ts
└── app.module.ts
```

**코드 작성 규칙:**
- DTO는 Zod 스키마 정의 후 `z.infer<>`로 타입 파생. Update DTO는 Create DTO의 `.partial()`
- List DTO에는 `page`, `limit`, `sort`, `order` 기본 포함
- Controller는 `ZodValidationPipe`로 body/query 검증, Envelope 패턴(`ok()`, `list()`)으로 응답
- 글로벌 `ExceptionFilter`에서 `HttpException`과 알 수 없는 에러를 Envelope 에러 형식으로 통일
- `main.ts`: `setGlobalPrefix('api')`, URI 버전 관리, GlobalExceptionFilter, CORS 설정

---

### Phase 3 — 고급 패턴 적용

다음 항목이 필요한 경우 해당 레퍼런스를 반드시 참조해 적용한다:

| 필요한 상황 | 참조 |
|------------|------|
| N:M, 상태전이, soft delete, 계층구조 등 스키마 → 엔드포인트 심화 | `references/schema-to-endpoints.md` |
| JWT / API Key / OAuth 인증 | `references/advanced.md` § 인증 & 인가 |
| 목록 API 페이지네이션 | `references/advanced.md` § 페이지네이션 |
| API 요청량 제한 | `references/advanced.md` § Rate Limiting |
| POST 중복 요청 방지 | `references/advanced.md` § 멱등성 |
| API 문서 자동화 | `references/advanced.md` § OpenAPI / Swagger |
| Guard, Interceptor, Decorator 심화 | `references/nestjs-patterns.md` |

---

## 설계 최종 체크리스트

코드 출력 전 내부적으로 반드시 확인:

**스키마 분석 (Phase 0 수행 시)**
- [ ] 모든 테이블이 독립/종속/연결 중 하나로 분류됐는가?
- [ ] `deletedAt` 테이블에서 GET 목록이 `deletedAt IS NULL`로 필터링되는가?
- [ ] `password`, `token` 등 민감 컬럼이 응답 DTO에서 제외됐는가?
- [ ] `createdAt`, `updatedAt`, `version`이 입력 DTO에서 제외됐는가?
- [ ] `organizationId` 등 테넌시 컬럼이 URL/바디가 아닌 JWT에서 추출되는가?
- [ ] N:M 연결 테이블에 별도 Controller가 없고, 부모 리소스에 관계 엔드포인트로 통합됐는가?

**URL & 메서드**
- [ ] URL이 명사 복수형 소문자 kebab-case인가?
- [ ] 동사가 URL에 포함되지 않았는가? (상태전이 액션은 예외)
- [ ] HTTP 메서드가 의미에 맞게 쓰였는가? (PATCH vs PUT)
- [ ] 중첩 라우팅이 2단계를 넘지 않는가?

**응답 형식**
- [ ] 모든 성공/에러 응답이 Envelope 패턴으로 통일되어 있는가?
- [ ] 에러 응답에 `code` (기계 읽기)와 `message` (사람 읽기)가 모두 있는가?
- [ ] 생성(POST) 성공 시 201 + `Location` 헤더가 있는가?
- [ ] 삭제(DELETE) 성공 시 204 no body인가?

**입력 검증**
- [ ] 모든 요청 body / query / params가 Zod로 검증되는가?
- [ ] 검증 실패 시 어떤 필드가 왜 틀렸는지 `details`에 담기는가?
- [ ] DTO 타입이 `z.infer<>`로 스키마에서 파생되는가?

**보안**
- [ ] 인증이 필요한 엔드포인트에 Guard가 적용됐는가?
- [ ] 에러 메시지에 스택 트레이스나 내부 경로가 노출되지 않는가?
- [ ] Rate Limiting이 공개 엔드포인트에 설정됐는가?

**확장성**
- [ ] API 버전 prefix(`/api/v1`)가 있는가?
- [ ] 목록 API에 페이지네이션이 있는가?
- [ ] 정렬(`sort`, `order`) 파라미터가 있는가?

---

## 상세 레퍼런스

- `references/schema-to-endpoints.md` — **DB 스키마 → 엔드포인트 도출 심화 (관계 유형, 상태전이, soft delete, 계층구조, DTO 설계 규칙)**
- `references/nestjs-patterns.md` — Guard, Interceptor, Decorator, Module 심화 패턴
- `references/advanced.md` — 인증(JWT/API Key), 페이지네이션, Rate Limiting, 멱등성, OpenAPI, Webhook
- `references/rest-conventions.md` — RESTful 설계 심화 (네이밍, 필터링, 에러코드 목록)
