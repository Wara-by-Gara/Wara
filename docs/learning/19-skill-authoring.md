# 19. Skill 만들기

> 자주 하는 작업을 매크로처럼 묶어 호출 가능한 명령으로. WARA는 `api-design`, `drizzle-schema` 2개를 자체 보유.

---

## 1. Skill이 뭔지

- **재사용 가능한 작업 패턴** + **관련 지식**을 한 폴더에 묶음
- 사용자가 `/skill-name`으로 호출하거나, 트리거 조건 매치 시 자동 활성화
- Claude가 작업할 때 그 스킬의 `SKILL.md` 지시를 그대로 따름

---

## 2. WARA의 스킬

`.claude/skills/`:
```
.claude/skills/
├── api-design/
│   ├── SKILL.md
│   ├── api-design.skill        # 메타
│   └── references/
│       ├── advanced.md
│       ├── frameworks.md
│       ├── nestjs-patterns.md
│       ├── rest-conventions.md
│       └── schema-to-endpoints.md
└── drizzle-schema/
    ├── SKILL.md
    └── references/
        ├── advanced.md
        ├── design-patterns.md
        ├── mysql.md
        ├── postgres.md
        └── sqlite.md
```

### 어떻게 작동
1. 사용자가 `Drizzle로 user 테이블 만들어줘` 입력
2. `drizzle-schema` 스킬의 description이 매치 (트리거)
3. Claude가 `SKILL.md` 지시 사항 로드
4. 필요 시 `references/postgres.md` 같은 보조 자료 추가 로드
5. 그 패턴대로 작업 수행

---

## 3. `SKILL.md` 구조

`.claude/skills/drizzle-schema/SKILL.md` 첫 부분:
```markdown
---
name: drizzle-schema
description: >
  Use this skill whenever the user wants to design, refine, or write a database schema using Drizzle ORM.
  Triggers include: any mention of Drizzle, drizzle-orm, drizzle schema, DB 설계, 데이터베이스 스키마,
  테이블 설계, ERD 설계, schema.ts 작성, 정규화, 인덱스 전략, upsert, 낙관적 락,
  트랜잭션, join 최적화, or requests involving TypeScript ORM with PostgreSQL.
  Also use when the user shares entities, relationships, or a rough DB plan and wants it turned into Drizzle code.
  This skill MUST be used even for simple requests like "user 테이블 만들어줘" when Drizzle is the ORM.
  Always apply 3NF normalization, advanced indexing strategy, and extensibility considerations.
---

# Drizzle Schema Skill

Production-ready DB 설계 + Drizzle ORM TypeScript 코드 생성.
3NF 정규화, 인덱싱 전략, 트랜잭션, 낙관적 락, Upsert, 확장성까지 고려한다.

---

## Workflow

### Phase 1 — 설계 리뷰 & 정규화
...
```

### 핵심 요소

#### (1) Frontmatter — `name`, `description`
- **`name`**: 호출 식별자 (`/drizzle-schema`로 호출 가능)
- **`description`**: **언제 자동 활성화할지 결정하는 트리거 문장**. Claude가 매 발화마다 이 description을 보고 매치 여부 판단

#### (2) Workflow
스킬의 작업 단계를 명확히. WARA의 drizzle-schema는:
- Phase 1: 설계 리뷰 & 정규화
- Phase 2: 인덱싱 전략
- Phase 3: 코드 생성
- Phase 4: 트랜잭션·낙관적 락
- Phase 5: 마이그레이션 & 검증

#### (3) Rules
**Always** / **Never** 형태로 명시. 예: "Always apply 3NF normalization".

#### (4) References (선택)
세부 지식은 `references/` 폴더에 분리. SKILL.md는 짧게, 깊은 내용은 reference로.

---

## 4. Skill을 언제 만들까

### ✅ 만들 가치 있음
- **같은 패턴 3회 이상** 반복 (예: "엔티티 → Drizzle 스키마" 변환)
- 작업에 **정형화된 단계**가 있음
- **도메인 지식이 깊어야** 잘됨 (외부 자료 참조 필요)
- 팀이 함께 쓸 수 있음

### ❌ 만들지 말 것
- 1회성 작업
- 너무 일반적 ("코드 짜기" 같은 광범위 트리거)
- CLAUDE.md로 표현 가능한 단순 규칙

---

## 5. Skill 만드는 단계

### 1. 빈 폴더 + SKILL.md
```bash
mkdir -p .claude/skills/my-skill
```

`.claude/skills/my-skill/SKILL.md`:
```markdown
---
name: my-skill
description: >
  Use this skill when [구체적 트리거 조건].
  Triggers include: keyword1, keyword2, keyword3.
  This skill MUST be used even for simple requests like "예시 발화".
---

# My Skill

[한 줄 목적]

## Workflow
### Phase 1 — ...
### Phase 2 — ...

## Rules
### Always
- ...
### Never
- ...
```

### 2. description은 트리거 사전 + 사용 강도
- 키워드 나열: "Triggers include: A, B, C, ..."
- 강제어 추가: "This skill MUST be used even for simple requests like ..."
- description이 모호하면 Claude가 활성 안 함

### 3. Workflow는 단계별로
- 사람이 따라할 수 있는 단계
- "왜"보다 "어떻게"

### 4. References 분리 (선택)
긴 자료는 SKILL.md 안에 다 넣지 말고 별도 파일로. SKILL.md에서 "자세한 PostgreSQL 인덱스 전략은 `references/postgres.md` 참고" 형태로 링크.

### 5. 시험
같은 세션에서 직접 트리거되는 발화로 테스트:
> "사용자 테이블 만들어줘 (Drizzle 사용)"

→ `drizzle-schema` 스킬이 활성화되면 OK.

---

## 6. WARA의 두 스킬 분석

### `api-design`
**트리거**: REST API 설계, NestJS controller/guard/pipe, 인증, 페이지네이션, OpenAPI...
**특히**: "Drizzle 스키마를 공유하고 API 만들어달라"는 요청이 핵심 시나리오
**references**:
- `rest-conventions.md` — HTTP method, status code 규칙
- `nestjs-patterns.md` — Controller·Service·Guard·Pipe 패턴
- `schema-to-endpoints.md` — DB 스키마 → 엔드포인트 매핑
- `advanced.md` — Rate limit, 멱등성, 캐싱
- `frameworks.md` — Express/Fastify 비교

### `drizzle-schema`
**트리거**: Drizzle/DB 설계 관련 모든 발화
**특히**: "user 테이블 만들어줘" 같은 단순 요청에도 강제 적용
**references**:
- `postgres.md`, `mysql.md`, `sqlite.md` — DB별 디테일
- `design-patterns.md` — Soft delete, audit trail, etc
- `advanced.md` — 인덱스, 트랜잭션, 낙관적 락

---

## 7. 좋은 description 예시

### ❌ 너무 광범위
```yaml
description: Use this skill when the user wants to code anything related to a database.
```
→ Claude가 거의 매번 활성화 → 비효율 + 무관한 작업에 적용.

### ✅ WARA의 drizzle-schema
```yaml
description: >
  Use this skill whenever the user wants to design, refine, or write a database schema using Drizzle ORM.
  Triggers include: any mention of Drizzle, drizzle-orm, drizzle schema, DB 설계, ...
  This skill MUST be used even for simple requests like "user 테이블 만들어줘" when Drizzle is the ORM.
  Always apply 3NF normalization, advanced indexing strategy, and extensibility considerations.
```
→ 구체적 트리거 + 강도 + 결과물 품질 기준까지.

---

## 8. Skill 호출 방법 3가지

### (1) 자동 트리거
description 매치 시 Claude가 자동 활성. 가장 자주 일어남.

### (2) 슬래시 명령
```
/drizzle-schema user 테이블 만들어줘
```
명시적 활성화.

### (3) 메타 호출 (Skill 도구)
Claude 내부에서 다른 스킬을 호출하는 경우. 일반 사용자는 안 신경 써도 됨.

---

## 9. Skill 관리

### 새 추가 시
- 폴더 + SKILL.md 만들기
- 같은 세션에서 트리거 시험
- 팀 공유 (git에 commit)

### 수정 시
- description 자주 안 건드림 (한 번 잡으면 안정적)
- Workflow / Rules는 패턴이 바뀌면 즉시 갱신

### 제거 시
- 폴더 삭제 → 다음 세션부터 사라짐

---

## 10. 흔한 함정

### Skill끼리 트리거 겹침
- `api-design`과 `drizzle-schema`가 둘 다 활성화될 수 있음
- WARA에선 그게 의도 (스키마 받아 API 만드는 시나리오)
- 단, 무관한 스킬끼리 자주 겹치면 둘 다 자주 잘못 발동 → description 좁히기

### Workflow가 일반론
"좋은 코드를 작성한다" 같은 추상은 안 됨. 단계가 구체적이어야 Claude가 실행 가능.

### references를 SKILL.md에 다 박음
- SKILL.md가 너무 길면 매번 모든 컨텍스트 차지
- 단계별 필요한 자료만 references로 분리

### Description 강도 부족
- "Use this if applicable" → Claude가 무시할 수 있음
- "MUST be used" → 강제. 정말 필요할 때만 사용

---

## 11. 체크리스트

- [ ] Skill의 폴더 구조 (SKILL.md + references)를 안다
- [ ] frontmatter의 description이 트리거 사전 역할을 하는 걸 안다
- [ ] WARA의 두 스킬이 어떤 시나리오에 활성되는지 안다
- [ ] Skill을 새로 만들 때의 단계를 안다
- [ ] description 좁히기·강도 조절의 중요성을 안다

→ 다음: [20. 작은 패턴 모음](./20-small-patterns.md)
