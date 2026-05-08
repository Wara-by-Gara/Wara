# Drizzle ORM — 심화 설계 패턴

---

## § 낙관적 락 (Optimistic Lock)

### 언제 쓰는가
- 동시에 같은 레코드를 수정할 가능성이 **낮지만**, 충돌 시 덮어쓰기를 막아야 할 때
- 비관적 락(SELECT FOR UPDATE)보다 처리량이 높고 데드락 위험이 없음
- 예: 문서 편집, 재고 수량, 설정 업데이트

### 스키마
```ts
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'),
  version: integer('version').notNull().default(0),   // ← 핵심
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 업데이트 로직 (Drizzle)
```ts
import { eq, and } from 'drizzle-orm';

async function updateDocument(id: string, currentVersion: number, newTitle: string) {
  const result = await db
    .update(documents)
    .set({
      title: newTitle,
      version: currentVersion + 1,   // version 증가
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, id),
        eq(documents.version, currentVersion),  // 현재 버전과 일치할 때만 업데이트
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Conflict: 다른 사람이 이미 수정했습니다. 최신 데이터를 다시 불러오세요.');
  }
  return result[0];
}
```

### 비관적 락이 더 나은 경우
- 충돌이 **자주** 발생하는 경우 (롤백 비용이 큼)
- 금융 트랜잭션처럼 충돌을 절대 허용할 수 없는 경우
- → `db.execute(sql\`SELECT ... FOR UPDATE\`)` 사용

---

## § Upsert (INSERT ... ON CONFLICT)

### 언제 쓰는가
- 존재하면 update, 없으면 insert를 원자적으로 처리
- 중복 insert를 방지하고 싶을 때
- 예: 소셜 로그인 계정 동기화, 일별 통계 누적, 설정값 저장

### 기본 Upsert — 충돌 시 업데이트
```ts
await db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'Alice',
  })
  .onConflictDoUpdate({
    target: users.email,               // unique 컬럼 or 복합 컬럼
    set: {
      name: 'Alice Updated',
      updatedAt: new Date(),
    },
  });
```

### Upsert — 충돌 시 무시 (중복 무시)
```ts
await db
  .insert(postViews)
  .values({ postId, userId })
  .onConflictDoNothing();
```

### 복합 unique 컬럼 upsert
```ts
// 중간 테이블처럼 복합 unique가 target인 경우
await db
  .insert(userRoles)
  .values({ userId, roleId })
  .onConflictDoUpdate({
    target: [userRoles.userId, userRoles.roleId],
    set: { assignedAt: new Date() },
  });
```

### 일별 통계 누적 upsert
```ts
export const dailyStats = pgTable('daily_stats', {
  date: date('date').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  views: integer('views').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.date, t.userId] }),
}));

// 호출할 때마다 +1 누적
await db
  .insert(dailyStats)
  .values({ date: today, userId, views: 1 })
  .onConflictDoUpdate({
    target: [dailyStats.date, dailyStats.userId],
    set: {
      views: sql`${dailyStats.views} + 1`,  // 현재값 + 1
    },
  });
```

---

## § Transaction

### 언제 쓰는가
- 여러 테이블의 변경이 **모두 성공하거나 모두 실패해야** 할 때
- 예: 주문 생성 + 재고 차감 + 결제 기록, 계좌 이체

### 기본 트랜잭션
```ts
await db.transaction(async (tx) => {
  // 주문 생성
  const [order] = await tx
    .insert(orders)
    .values({ userId, totalAmount })
    .returning();

  // 주문 아이템 insert
  await tx.insert(orderItems).values(
    items.map((item) => ({ orderId: order.id, productId: item.id, quantity: item.qty }))
  );

  // 재고 차감
  for (const item of items) {
    const result = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.qty}` })
      .where(
        and(
          eq(products.id, item.id),
          gte(products.stock, item.qty),  // 재고 부족 방지
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error(`재고 부족: ${item.id}`);  // throw 시 자동 rollback
    }
  }
});
```

### 중첩 트랜잭션 (Savepoint)
```ts
await db.transaction(async (tx) => {
  await tx.insert(orders).values(order);

  // 실패해도 외부 트랜잭션은 유지하고 싶을 때 → nested transaction
  try {
    await tx.transaction(async (nestedTx) => {
      await nestedTx.insert(notifications).values(notification);
    });
  } catch {
    // 알림 실패는 무시하고 주문은 커밋
  }
});
```

### 트랜잭션 격리 수준
```ts
// 기본: read committed
// 팬텀 리드 방지가 필요하면 serializable
await db.transaction(
  async (tx) => { /* ... */ },
  { isolationLevel: 'serializable' }
);
```

---

## § 인덱싱 전략

### 인덱스 설계 원칙
1. **FK 컬럼 기본 인덱스**: 조인 성능의 기본
2. **선택도(Selectivity) 높은 컬럼 우선**: 카디널리티가 높을수록 효율적
3. **쓰기 트레이드오프**: 인덱스가 많을수록 INSERT/UPDATE 비용 증가 → 과도하게 만들지 않는다
4. **복합 인덱스 컬럼 순서**: `WHERE` 절에서 자주 쓰이는 컬럼을 앞에, 범위 조건 컬럼은 뒤에

### 복합 인덱스 (Composite Index)
```ts
// 쿼리: WHERE user_id = ? AND status = 'published' ORDER BY created_at DESC
// → user_id (등호), status (등호), created_at (정렬) 순으로
export const posts = pgTable('posts', {
  // ...컬럼 정의...
}, (t) => ({
  userStatusCreatedIdx: index('posts_user_status_created_idx')
    .on(t.userId, t.status, t.createdAt),
}));
```

### Partial Index (부분 인덱스) — PostgreSQL
```ts
// soft delete: 살아있는 레코드만 인덱싱 (deletedAt IS NULL)
// → 삭제된 레코드는 인덱스에서 제외 → 인덱스 크기 감소
import { sql } from 'drizzle-orm';

export const posts = pgTable('posts', {
  // ...
}, (t) => ({
  // 활성 레코드만 slug를 unique하게
  activeSlugIdx: uniqueIndex('posts_active_slug_idx')
    .on(t.slug)
    .where(sql`${t.deletedAt} IS NULL`),

  // 미발행 글만 별도 인덱싱
  draftUserIdx: index('posts_draft_user_idx')
    .on(t.userId)
    .where(sql`${t.status} = 'draft'`),
}));
```

### Covering Index
```ts
// SELECT id, title, created_at FROM posts WHERE user_id = ? AND status = 'published'
// → include로 select 컬럼까지 인덱스에 포함 → 테이블 접근 없이 인덱스만으로 응답
export const posts = pgTable('posts', {
  // ...
}, (t) => ({
  coveringIdx: index('posts_covering_idx')
    .on(t.userId, t.status)
    // NOTE: Drizzle의 covering index는 PG 전용 .include()로 작성 (버전 확인 필요)
    // 지원 안 되면 주석으로 CREATE INDEX ... INCLUDE (...) 형태로 명시
}));
```

### 인덱스 적용 여부 판단 기준

| 상황 | 권장 |
|------|------|
| FK 컬럼 | 항상 인덱스 |
| WHERE 조건에 자주 등장 | 인덱스 |
| ORDER BY 대상 컬럼 | 인덱스 (정렬 방향 맞추기) |
| LIKE '%keyword%' 검색 | 인덱스 효과 없음 → Full Text Search 고려 |
| boolean 컬럼 단독 | 선택도 낮아 비효율 → 복합 인덱스로 |
| 쓰기 빈도 매우 높음 | 인덱스 최소화 |

---

## § Join & Query 최적화

### Drizzle join 기본
```ts
// INNER JOIN
const result = await db
  .select({
    postId: posts.id,
    title: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.userId, users.id))
  .where(eq(posts.status, 'published'))
  .orderBy(desc(posts.createdAt))
  .limit(20);

// LEFT JOIN (댓글 없는 게시글도 포함)
const result = await db
  .select({ post: posts, commentCount: count(comments.id) })
  .from(posts)
  .leftJoin(comments, eq(comments.postId, posts.id))
  .groupBy(posts.id);
```

### relations()를 이용한 with() 쿼리 (N+1 방지)
```ts
// ❌ N+1 문제: 게시글마다 유저를 따로 조회
const posts = await db.select().from(posts);
for (const post of posts) {
  const user = await db.select().from(users).where(eq(users.id, post.userId));
}

// ✅ with()로 한 번에 조회
const postsWithAuthor = await db.query.posts.findMany({
  with: {
    author: true,
    tags: {
      with: { tag: true },
    },
  },
  where: eq(posts.status, 'published'),
  limit: 20,
});
```

### 페이지네이션 전략

**오프셋 방식** (단순하지만 대량 데이터에서 느려짐)
```ts
const page = 3, pageSize = 20;
await db.select().from(posts).limit(pageSize).offset((page - 1) * pageSize);
```

**커서 방식** (대량 데이터 권장)
```ts
// createdAt + id 조합 커서
await db
  .select()
  .from(posts)
  .where(
    or(
      lt(posts.createdAt, lastCreatedAt),
      and(eq(posts.createdAt, lastCreatedAt), lt(posts.id, lastId)),
    )
  )
  .orderBy(desc(posts.createdAt), desc(posts.id))
  .limit(20);
```

---

## § Unique & 복합 제약

### 단일 컬럼 unique
```ts
email: varchar('email', { length: 255 }).notNull().unique(),
```

### 복합 unique (테이블 정의 내)
```ts
export const follows = pgTable('follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id),
  followingId: uuid('following_id').notNull().references(() => users.id),
}, (t) => ({
  uniquePair: unique('follows_unique_pair').on(t.followerId, t.followingId),
  // 자기 자신 팔로우 방지는 DB check constraint 또는 앱 레벨에서 처리
}));
```

### Conditional Unique (Partial Unique Index — PG)
```ts
// 활성 상태인 slug만 unique, 삭제된 건 중복 허용
export const posts = pgTable('posts', {
  slug: varchar('slug', { length: 255 }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  activeSlugUnique: uniqueIndex('posts_active_slug_unique')
    .on(t.slug)
    .where(sql`${t.deletedAt} IS NULL`),
}));
```

---

## § 확장성 패턴

### 1. jsonb 메타데이터로 미래 컬럼 예비 확보
```ts
// 나중에 어떤 속성이 추가될지 모를 때
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),  // { color, size, weight, ... } 자유롭게
});
```

### 2. 멀티 테넌시 (SaaS 구조)
```ts
// 모든 핵심 테이블에 organizationId 추가
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
}, (t) => ({
  orgIdx: index('projects_org_id_idx').on(t.organizationId),
}));

// Row-Level Security (PostgreSQL)
// CREATE POLICY tenant_isolation ON projects
//   USING (organization_id = current_setting('app.current_org_id')::uuid);
```

### 3. RBAC (역할 기반 접근 제어)
```ts
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resource: varchar('resource', { length: 100 }).notNull(),   // 'post', 'user', ...
  action: varchar('action', { length: 50 }).notNull(),        // 'create', 'read', 'update', 'delete'
}, (t) => ({
  uniquePermission: unique().on(t.resource, t.action),
}));

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));
```

### 4. 이벤트 소싱 / 감사 로그 (Audit Log)
```ts
// 의도적 비정규화: 변경 당시의 스냅샷을 jsonb로 저장
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(),    // 'create' | 'update' | 'delete'
  resource: varchar('resource', { length: 100 }).notNull(), // 'post' | 'user' | ...
  resourceId: uuid('resource_id').notNull(),
  before: jsonb('before'),   // 변경 전 스냅샷
  after: jsonb('after'),     // 변경 후 스냅샷
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  actorIdx: index('audit_logs_actor_idx').on(t.actorId),
  resourceIdx: index('audit_logs_resource_idx').on(t.resource, t.resourceId),
  createdAtIdx: index('audit_logs_created_at_idx').on(t.createdAt),
}));
```

### 5. 계층 구조 — Closure Table 패턴
```ts
// 깊은 카테고리, 댓글 스레드, 조직도 등에 사용
// 재귀 쿼리 없이 모든 자손/조상을 O(1)로 조회 가능
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const categoryPaths = pgTable('category_paths', {
  ancestorId: uuid('ancestor_id').notNull().references(() => categories.id),
  descendantId: uuid('descendant_id').notNull().references(() => categories.id),
  depth: integer('depth').notNull(),  // 0 = 자기 자신, 1 = 직접 부모, ...
}, (t) => ({
  pk: primaryKey({ columns: [t.ancestorId, t.descendantId] }),
  descendantIdx: index('category_paths_descendant_idx').on(t.descendantId),
}));
```

### 6. 다국어 (i18n) 구조
```ts
// 번역 테이블 패턴
export const localeEnum = pgEnum('locale', ['ko', 'en', 'ja', 'zh']);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const productTranslations = pgTable('product_translations', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  locale: localeEnum('locale').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
}, (t) => ({
  pk: primaryKey({ columns: [t.productId, t.locale] }),
}));
```

---

## § 자주 하는 설계 실수 모음

| 실수 | 문제 | 해결 |
|------|------|------|
| status를 varchar로 선언 | 오타 가능, DB 레벨 제약 없음 | pgEnum 사용 |
| FK에 index 없음 | JOIN 시 풀스캔 | 모든 FK에 index 추가 |
| soft delete에 partial index 없음 | `WHERE deleted_at IS NULL` 느려짐 | partial index 추가 |
| 복합 index 컬럼 순서 잘못됨 | 인덱스 미사용 | 등호 조건 먼저, 범위/정렬 뒤에 |
| 트랜잭션 없이 여러 테이블 수정 | 중간 실패 시 데이터 불일치 | db.transaction() 감싸기 |
| 낙관적 락 없이 version 컬럼만 선언 | version 증가 조건 체크 안 함 | WHERE version = current 필수 |
| N+1 쿼리 | 루프 안에서 개별 조회 | with() 또는 join 사용 |
| 오프셋 페이지네이션 대량 데이터 | OFFSET 커질수록 느려짐 | 커서 기반 페이지네이션으로 전환 |
| jsonb 필드를 과도하게 사용 | 타입 안전성 없음, 인덱싱 제한 | 자주 조회·필터링되는 값은 컬럼으로 분리 |
