---
name: drizzle-schema
description: >
  Use this skill whenever the user wants to design, refine, or write a database schema using Drizzle ORM.
  Triggers include: any mention of Drizzle, drizzle-orm, drizzle schema, DB 설계, 데이터베이스 스키마, 테이블 설계,
  ERD 설계, schema.ts 작성, 정규화, 인덱스 전략, upsert, 낙관적 락, 트랜잭션, join 최적화,
  or requests involving TypeScript ORM with PostgreSQL/MySQL/SQLite.
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

코드 작성 전, 반드시 아래 순서로 설계를 다듬는다.

#### 1-1. 엔티티 & 관계 파악
- 어떤 테이블이 필요한지 목록화
- 각 관계 타입 확인: 1:1 / 1:N / N:M
- N:M은 항상 중간 테이블로 분리

#### 1-2. 3정규화(3NF) 적용

**1NF** — 원자값: 컬럼에 배열·중첩 없음 (단, `jsonb`/`array`는 의도적 예외 허용)
```
❌ tags: "travel,food,tech"   →   ✅ tags 별도 테이블 or text[](PG)
```

**2NF** — 부분 종속 제거: 복합 PK일 때 모든 컬럼이 PK 전체에 종속
```
❌ order_items(order_id, product_id, product_name)  ← product_name은 product_id에만 종속
✅ order_items(order_id, product_id, quantity)  +  products(id, name)
```

**3NF** — 이행 종속 제거: 비PK 컬럼이 다른 비PK 컬럼에 종속되지 않음
```
❌ orders(id, user_id, user_email, user_name)   ← user_email/name이 user_id에 종속
✅ orders(id, user_id)  +  users(id, email, name)
```

> ⚠️ **의도적 비정규화가 유리한 경우**: 읽기 전용 로그, 이력 스냅샷, 집계 캐시 등.
> 이 경우 반드시 주석으로 이유를 명시하고 허용한다.

#### 1-3. 누락 컬럼 제안
- `createdAt`, `updatedAt` — 거의 모든 테이블
- `deletedAt` — soft delete가 필요한 테이블
- `version` — 낙관적 락이 필요한 테이블
- `status` enum — 상태 전이가 있는 엔티티
- 스냅샷 컬럼 — 주문처럼 원본이 변경돼도 기록이 유지돼야 하는 경우

#### 1-4. 확장성 포인트 미리 짚기
- 다국어(i18n) 가능성 → `locale` 컬럼 또는 번역 테이블 구조 제안
- 멀티 테넌시 가능성 → `organizationId` 조기 추가
- 설정값이 늘어날 가능성 → `jsonb metadata` 컬럼 예비 확보
- 계층 구조가 깊어질 가능성 → self-join 또는 Closure Table 패턴
- 역할/권한이 복잡해질 가능성 → RBAC 구조 제안

설계 리뷰 후 **"이렇게 이해했습니다" 요약 테이블**을 보여주고 확인 받은 뒤 코드로 넘어간다.

---

### Phase 2 — Dialect 선택

사용자가 명시하지 않으면 확인 후 해당 레퍼런스를 참조한다:

- **PostgreSQL** → `drizzle-orm/pg-core` → `references/postgres.md`
- **MySQL** → `drizzle-orm/mysql-core` → `references/mysql.md`
- **SQLite** → `drizzle-orm/sqlite-core` → `references/sqlite.md`

---

### Phase 3 — 코드 작성

#### 파일 구조 (권장)
```
src/db/
├── schema/
│   ├── index.ts        ← 전체 re-export
│   ├── users.ts
│   ├── posts.ts
│   └── ...
├── relations.ts        ← relations() 전부 모아서 정의
└── index.ts            ← drizzle() 인스턴스 + db export
```

#### 핵심 패턴 빠른 참조

**기본 테이블 (확장성 포함)**
```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  version: integer('version').notNull().default(0),           // 낙관적 락용
  metadata: jsonb('metadata'),                                // 확장 여지
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete
});
```

**FK + onDelete 정책 (항상 명시)**
```ts
// cascade: 부모 삭제 시 자식도 삭제
// set null: 부모 삭제 시 FK를 null로
// restrict: 참조 중이면 부모 삭제 불가
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

**N:M 중간 테이블**
```ts
export const postTags = pgTable('post_tags', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId:  uuid('tag_id').notNull().references(() => tags.id,  { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.tagId] }),
}));
```

**relations() — with() 쿼리용**
```ts
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
}));
```

**Type Inference**
```ts
export type User    = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
```

---

### Phase 4 — 고급 설계 적용

다음 항목이 필요한 경우 `references/advanced.md`를 반드시 참조해 적용한다:

| 필요한 상황 | 참조 섹션 |
|------------|----------|
| 동시 수정 충돌 방지 | § 낙관적 락 (Optimistic Lock) |
| 중복 insert 방지 / 있으면 update | § Upsert |
| 여러 테이블을 묶어 원자적 처리 | § Transaction |
| 복잡한 join 최적화 | § Join & Query 최적화 |
| 인덱스 전략 설계 (복합/부분/커버링) | § 인덱싱 전략 |
| 미래 기능 추가를 대비한 구조 | § 확장성 패턴 |
| 복합 unique 제약 설계 | § Unique & 복합 제약 |

---

## 설계 최종 체크리스트

코드 출력 전 내부적으로 반드시 확인:

**정규화**
- [ ] 3NF 위반 없는가? (이행 종속, 부분 종속)
- [ ] 의도적 비정규화에 주석이 달려 있는가?

**무결성**
- [ ] 모든 FK에 `onDelete` 정책이 명시되어 있는가?
- [ ] Unique해야 하는 컬럼/조합에 unique constraint가 있는가?
- [ ] status 컬럼이 varchar 대신 enum인가?

**인덱스**
- [ ] FK 컬럼에 index가 있는가?
- [ ] 자주 필터링되는 컬럼에 index가 있는가?
- [ ] soft delete 사용 시 `deletedAt IS NULL` partial index가 있는가?
- [ ] 복합 조회 패턴에 맞는 복합 index의 컬럼 순서가 올바른가?
- [ ] 쓰기가 많은 테이블에 index가 과도하게 많지 않은가?

**동시성**
- [ ] 경쟁 조건이 생길 수 있는 곳에 트랜잭션이 적용되는가?
- [ ] 충돌이 드물고 롤백 비용이 낮은 곳에 낙관적 락이 쓰이는가?
- [ ] Upsert가 필요한 곳에 `.onConflictDoUpdate()`가 사용되는가?

**확장성**
- [ ] 멀티 테넌시, 다국어, 역할 확장 여지가 있는가?
- [ ] 나중에 컬럼 추가가 쉽도록 `jsonb metadata` 예비 컬럼이 있는가?
- [ ] 계층 구조가 깊어질 경우를 대비한 구조인가?

---

## 상세 레퍼런스

- `references/postgres.md` — PG 전용 타입 및 패턴
- `references/mysql.md` — MySQL 전용 타입 및 패턴
- `references/sqlite.md` — SQLite 전용 타입 및 패턴
- `references/design-patterns.md` — 공통 설계 패턴 (네이밍, 도메인 예시)
- `references/advanced.md` — **낙관적 락, Upsert, Transaction, Join, 인덱싱, 확장성 패턴 심화**
