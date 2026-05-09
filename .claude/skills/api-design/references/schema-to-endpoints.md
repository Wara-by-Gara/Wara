# DB 스키마 → 엔드포인트 심화

## 목차
1. [1:N 관계](#1n-관계)
2. [N:M 관계 (연결 테이블)](#nm-관계-연결-테이블)
3. [Self-join (계층 구조)](#self-join-계층-구조)
4. [Soft Delete](#soft-delete)
5. [상태 전이 (status enum)](#상태-전이-status-enum)
6. [낙관적 락 (version)](#낙관적-락-version)
7. [멀티 테넌시 (organizationId)](#멀티-테넌시-organizationid)
8. [DTO 설계 규칙](#dto-설계-규칙)
9. [응답 DTO — 필드 노출 규칙](#응답-dto--필드-노출-규칙)

---

## 1:N 관계

### 판단 기준: 중첩 라우트 vs 독립 라우트

```
질문 1: 자식 리소스가 부모 없이 단독으로 조회될 일이 있는가?
  → Yes (댓글을 전체 검색, 알림 목록 등)  →  독립 Controller + 쿼리 파라미터 필터
  → No  (게시글의 댓글, 주문의 주문상품)   →  중첩 라우트

질문 2: 자식 리소스가 여러 부모를 가질 수 있는가? (다형성 FK)
  → Yes                                   →  독립 Controller
```

### Case A — 중첩 라우트 (종속 리소스)

```ts
// Drizzle 스키마
export const comments = pgTable('comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  content:   text('content').notNull(),
  authorId:  uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

```
엔드포인트:
GET    /posts/:postId/comments        댓글 목록 (postId 필터 자동)
POST   /posts/:postId/comments        댓글 생성 (postId는 URL에서 주입, body에서 받지 않음)
PATCH  /posts/:postId/comments/:id    댓글 수정 (postId로 소유권 검증)
DELETE /posts/:postId/comments/:id    댓글 삭제
```

```ts
// comments.controller.ts
@Controller('posts/:postId/comments')
export class CommentsController {
  @Post()
  @HttpCode(201)
  async create(
    @Param('postId') postId: string,
    @Body(new ZodValidationPipe(CreateCommentSchema)) dto: CreateCommentDto,
    @CurrentUser('sub') userId: string,
  ) {
    // postId는 URL에서, authorId는 JWT에서 — body로 받지 않는다
    return ok(await this.commentsService.create({ ...dto, postId, authorId: userId }));
  }

  @Patch(':id')
  async update(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCommentSchema)) dto: UpdateCommentDto,
    @CurrentUser('sub') userId: string,
  ) {
    // postId로 소유권 검증 (다른 게시글의 댓글 수정 방지)
    return ok(await this.commentsService.updateOrFail(id, postId, userId, dto));
  }
}
```

### Case B — 독립 라우트 + 쿼리 필터

```ts
// Drizzle 스키마 — 여러 리소스 타입에 달릴 수 있는 알림
export const notifications = pgTable('notifications', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id),
  type:       notificationTypeEnum('type').notNull(),
  readAt:     timestamp('read_at'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});
```

```
엔드포인트:
GET    /notifications               내 알림 목록 (JWT에서 userId 추출)
PATCH  /notifications/:id/read      읽음 처리
POST   /notifications/read-all      전체 읽음 처리
```

---

## N:M 관계 (연결 테이블)

연결 테이블은 자체 Controller를 만들지 않는다.
부모 리소스 중 "주체"가 되는 쪽의 Controller에 관계 엔드포인트로 통합한다.

```ts
// Drizzle 스키마
export const postTags = pgTable('post_tags', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId:  uuid('tag_id').notNull().references(() => tags.id,  { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.postId, t.tagId] }) }));
```

```
엔드포인트 (PostsController 안에):
GET    /posts/:postId/tags           연결된 태그 목록
POST   /posts/:postId/tags/:tagId    태그 연결
DELETE /posts/:postId/tags/:tagId    태그 연결 해제

❌ 하지 말 것:
POST /post-tags           (연결 테이블 직접 노출)
GET  /post-tags?postId=xx (연결 테이블 직접 조회)
```

```ts
// posts.controller.ts에 추가
@Get(':postId/tags')
async getTags(@Param('postId') postId: string) {
  return ok(await this.postsService.getTags(postId));
}

@Post(':postId/tags/:tagId')
@HttpCode(204)
async addTag(
  @Param('postId') postId: string,
  @Param('tagId') tagId: string,
) {
  await this.postsService.addTag(postId, tagId);
}

@Delete(':postId/tags/:tagId')
@HttpCode(204)
async removeTag(
  @Param('postId') postId: string,
  @Param('tagId') tagId: string,
) {
  await this.postsService.removeTag(postId, tagId);
}
```

### N:M 연결 테이블에 추가 데이터가 있는 경우

```ts
// 추가 컬럼이 있으면 연결 자체가 하나의 리소스 — 독립 Controller 고려
export const userCourses = pgTable('user_courses', {
  userId:      uuid('user_id').notNull().references(() => users.id),
  courseId:    uuid('course_id').notNull().references(() => courses.id),
  enrolledAt:  timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  progress:    integer('progress').notNull().default(0),  // ← 추가 데이터
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.courseId] }) }));
```

```
추가 데이터가 있으므로 enrollments 리소스로 분리:
POST   /enrollments                  수강 신청 (userId는 JWT, courseId는 body)
GET    /enrollments/me               내 수강 목록
PATCH  /enrollments/:courseId        진행률 업데이트
DELETE /enrollments/:courseId        수강 취소
```

---

## Self-join (계층 구조)

```ts
// Drizzle 스키마
export const categories = pgTable('categories', {
  id:       uuid('id').primaryKey().defaultRandom(),
  name:     varchar('name', { length: 100 }).notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
  depth:    integer('depth').notNull().default(0),
});
```

```
엔드포인트:
GET  /categories              전체 트리 또는 최상위만 (?tree=true | ?parentId=null)
GET  /categories/:id          단건
GET  /categories/:id/children 직계 자식만
POST /categories              생성 (parentId optional)
PATCH /categories/:id         수정
DELETE /categories/:id        삭제 (자식 있으면 409)
```

```ts
// list DTO
export const ListCategoriesSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),  // null이면 루트만, 없으면 전체
  tree:     z.coerce.boolean().default(false),         // true면 중첩 트리 구조 반환
});

// Service
async findAll(query: ListCategoriesDto) {
  if (query.tree) return this.buildTree();          // 전체 트리 재귀 조립
  if (query.parentId === null) return this.findRoots();    // 루트만
  if (query.parentId) return this.findChildren(query.parentId); // 특정 자식
  return this.findAll();
}
```

---

## Soft Delete

```ts
// Drizzle 스키마에 deletedAt이 있는 경우
export const posts = pgTable('posts', {
  id:        uuid('id').primaryKey().defaultRandom(),
  deletedAt: timestamp('deleted_at'),  // ← soft delete 시그널
});
```

```
DELETE /posts/:id  → 실제 삭제 X, deletedAt = NOW() 세팅 → 204 반환
GET    /posts      → 기본적으로 deletedAt IS NULL 필터 자동 적용
                     ?includeDeleted=true (admin only) 로 삭제된 것도 조회 가능
```

```ts
// Service 패턴
async remove(id: string): Promise<void> {
  const post = await this.findOneOrFail(id);
  await db.update(posts)
    .set({ deletedAt: new Date() })
    .where(eq(posts.id, id));
}

async findAll(query: ListPostsDto, includeDeleted = false) {
  return db.select().from(posts)
    .where(
      and(
        includeDeleted ? undefined : isNull(posts.deletedAt),
        // ... 기타 필터
      )
    );
}

// Controller — admin만 삭제 항목 조회 가능
@Get()
async findAll(
  @Query(new ZodValidationPipe(ListPostsSchema)) query: ListPostsDto,
  @CurrentUser() user: JwtPayload,
) {
  const includeDeleted = query.includeDeleted && user.role === 'admin';
  const { data, total } = await this.postsService.findAll(query, includeDeleted);
  return list(data, { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) });
}
```

---

## 상태 전이 (status enum)

```ts
// Drizzle 스키마
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'shipped', 'delivered', 'cancelled']);
export const orders = pgTable('orders', {
  id:     uuid('id').primaryKey().defaultRandom(),
  status: orderStatusEnum('status').notNull().default('pending'),
});
```

### 판단 기준: 인라인 PATCH vs 전용 액션 엔드포인트

```
단순 상태 변경 (검증 로직 없음)  →  PATCH /orders/:id { status: "shipped" }
비즈니스 로직 포함               →  POST  /orders/:id/cancel
                                     POST  /orders/:id/ship
```

```ts
// 복잡한 상태 전이 — 전용 액션 엔드포인트
// 허용된 상태 전이 맵
const TRANSITIONS: Record<string, string[]> = {
  pending:   ['paid', 'cancelled'],
  paid:      ['shipped', 'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

// POST /orders/:id/cancel
@Post(':id/cancel')
@HttpCode(200)
async cancel(
  @Param('id') id: string,
  @Body(new ZodValidationPipe(CancelOrderSchema)) dto: CancelOrderDto,
  @CurrentUser('sub') userId: string,
) {
  const order = await this.ordersService.findOneOrFail(id);

  if (!TRANSITIONS[order.status].includes('cancelled')) {
    throw new ConflictException({
      code: 'INVALID_STATUS_TRANSITION',
      message: `${order.status} 상태에서는 취소할 수 없습니다`,
    });
  }

  return ok(await this.ordersService.cancel(id, { reason: dto.reason, cancelledBy: userId }));
}
```

---

## 낙관적 락 (version)

```ts
// Drizzle 스키마
export const documents = pgTable('documents', {
  id:      uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  version: integer('version').notNull().default(0),  // ← 낙관적 락 시그널
});
```

```ts
// Update DTO에 version 필수 포함
export const UpdateDocumentSchema = z.object({
  content: z.string().min(1).optional(),
  version: z.number().int().nonnegative(),  // ← 필수
});

// Service
async update(id: string, dto: UpdateDocumentDto) {
  const result = await db
    .update(documents)
    .set({ content: dto.content, version: dto.version + 1 })
    .where(
      and(
        eq(documents.id, id),
        eq(documents.version, dto.version),  // 버전 일치할 때만 업데이트
      )
    )
    .returning();

  if (result.length === 0) {
    throw new ConflictException({
      code: 'OPTIMISTIC_LOCK_CONFLICT',
      message: '다른 사용자가 이미 수정했습니다. 최신 버전을 불러온 후 다시 시도해 주세요.',
    });
  }

  return result[0];
}
```

---

## 멀티 테넌시 (organizationId)

```ts
// Drizzle 스키마
export const projects = pgTable('projects', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name:           varchar('name', { length: 100 }).notNull(),
});
```

```
❌ 하지 말 것
GET  /organizations/:orgId/projects  (URL에 organizationId 노출 — 다른 org 접근 시도 가능)
POST /projects { organizationId: "..." }  (body로 받음 — 위조 가능)

✅ 올바른 방식
GET  /projects     organizationId는 JWT 클레임에서 추출
POST /projects     organizationId는 JWT 클레임에서 추출
```

```ts
// JWT payload에 organizationId 포함
interface JwtPayload {
  sub: string;
  organizationId: string;
  role: string;
}

// Controller — organizationId를 URL/body가 아닌 JWT에서 주입
@Get()
async findAll(
  @Query(new ZodValidationPipe(ListProjectsSchema)) query: ListProjectsDto,
  @CurrentUser('organizationId') orgId: string,
) {
  const { data, total } = await this.projectsService.findAll(query, orgId);
  return list(data, { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) });
}

@Post()
async create(
  @Body(new ZodValidationPipe(CreateProjectSchema)) dto: CreateProjectDto,
  @CurrentUser('organizationId') orgId: string,
) {
  return ok(await this.projectsService.create({ ...dto, organizationId: orgId }));
}
```

---

## DTO 설계 규칙

### Create DTO — 포함/제외 기준

```
✅ 포함 (사용자가 입력)
  - 도메인 데이터 컬럼 (name, email, content 등)
  - 선택적 FK (categoryId, parentId 등 — 선택 관계)
  - metadata jsonb (optional object)

❌ 제외 (자동 생성/주입)
  - id (서버에서 uuid 생성)
  - createdAt, updatedAt (DB defaultNow())
  - deletedAt (항상 null로 시작)
  - version (항상 0으로 시작)
  - 필수 FK가 URL 파라미터에 있을 때 (postId → /posts/:postId/comments)
  - organizationId, userId 등 JWT에서 추출하는 컬럼
```

### Update DTO — PATCH vs PUT

```ts
// PATCH (부분 수정) — 모든 필드 optional
export const UpdatePostSchema = CreatePostSchema
  .omit({ authorId: true })   // 작성자는 변경 불가
  .partial();                  // 나머지 전부 optional

// 낙관적 락이 있으면 version만 required
export const UpdateDocumentSchema = CreateDocumentSchema
  .partial()
  .extend({ version: z.number().int() });  // version은 필수
```

### Response DTO — 민감 필드 제거

```ts
// 응답에서 제거해야 할 컬럼들
const SENSITIVE_FIELDS = ['password', 'hashedPassword', 'salt', 'refreshToken', 'resetToken', 'secret'];

// Drizzle select로 처음부터 제외
const user = await db.select({
  id:        users.id,
  email:     users.email,
  name:      users.name,
  role:      users.role,
  createdAt: users.createdAt,
  // password: users.password  ← 절대 포함하지 않음
}).from(users).where(eq(users.id, id));
```

---

## 응답 DTO — 필드 노출 규칙

### 목록 응답 vs 단건 응답

```ts
// 목록 (GET /posts) — 요약 정보만
type PostSummary = {
  id: string;
  title: string;
  authorName: string;   // JOIN해서 이름만
  commentCount: number; // 집계값
  createdAt: string;
};

// 단건 (GET /posts/:id) — 상세 정보 포함
type PostDetail = PostSummary & {
  content: string;         // 본문은 단건에만
  author: { id, name, avatar };  // 작성자 객체
  tags: { id, name }[];
  updatedAt: string;
};
```

### 관계 데이터 중첩 수준

```
1단계 중첩 허용:  post.author = { id, name, avatar }
2단계 중첩 금지:  post.author.organization.members  ← 별도 엔드포인트로 분리
```

```ts
// Drizzle에서 단건 조회 시 관계 데이터 JOIN
const post = await db.query.posts.findFirst({
  where: eq(posts.id, id),
  with: {
    author: { columns: { id: true, name: true, avatarUrl: true } },  // 1단계만
    tags:   { columns: { id: true, name: true } },
    // author의 organization은 포함하지 않음
  },
});
```
