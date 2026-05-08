# DB 설계 공통 패턴

## 네이밍 컨벤션

| 구분 | 규칙 | 예 |
|------|------|---|
| 테이블명 | snake_case, 복수형 | `users`, `blog_posts` |
| 컬럼명 | snake_case | `user_id`, `created_at` |
| TS 변수 | camelCase | `userId`, `createdAt` |
| PK | `id` | - |
| FK | `{테이블단수}_id` | `user_id`, `post_id` |
| 중간 테이블 | `{a}_{b}s` 또는 `{a}_{b}` | `post_tags`, `user_roles` |
| Index명 | `{table}_{columns}_idx` | `posts_user_id_idx` |
| Unique Index명 | `{table}_{columns}_unique_idx` | `posts_slug_unique_idx` |

---

## Audit 컬럼 패턴

대부분의 테이블에 넣는 기본 컬럼:

```ts
// 최소
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

// Soft delete 포함
deletedAt: timestamp('deleted_at', { withTimezone: true }),

// 생성/수정자 추적
createdBy: uuid('created_by').references(() => users.id),
updatedBy: uuid('updated_by').references(() => users.id),
```

---

## 관계 패턴

### 1:1
```ts
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
});
```

### 1:N
```ts
// posts.userId → users.id (많은 posts가 한 user에 속함)
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

### N:M (중간 테이블)
```ts
export const postTags = pgTable('post_tags', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.tagId] }),
}));
```

---

## onDelete 정책 선택 가이드

| 상황 | 정책 | 이유 |
|------|------|------|
| user 삭제 시 게시글도 삭제 | `cascade` | 종속 데이터 일괄 삭제 |
| user 삭제해도 댓글은 남김 | `set null` | 익명 처리 |
| 참조 중이면 삭제 막기 | `restrict` | 데이터 무결성 보호 |

---

## 자주 쓰는 도메인 패턴

### 사용자 인증
```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),  // nullable = 소셜 로그인
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
  userIdIdx: index('sessions_user_id_idx').on(t.userId),
}));
```

### 소셜 로그인 (OAuth)
```ts
export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'github', 'kakao', 'naver']);

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueProvider: uniqueIndex('oauth_accounts_provider_unique_idx').on(t.provider, t.providerAccountId),
}));
```

### 알림(Notification)
```ts
export const notificationTypeEnum = pgEnum('notification_type', [
  'comment', 'like', 'follow', 'mention', 'system'
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  payload: jsonb('payload'),  // 알림 관련 메타데이터
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userUnreadIdx: index('notifications_user_unread_idx').on(t.userId, t.readAt),
}));
```

### 파일/이미지 업로드
```ts
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  url: varchar('url', { length: 1000 }).notNull(),
  key: varchar('key', { length: 500 }).notNull().unique(),  // S3 key
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 정규화 체크 포인트

1. **1NF**: 컬럼에 배열/중첩 값이 없는가? (단, jsonb/array 타입은 의도적으로 허용)
2. **2NF**: 복합 PK일 때 컬럼이 PK 전체에 종속되는가?
3. **3NF**: 컬럼이 PK에 직접 종속되는가? (transitive dependency 없는가)

### 자주 하는 실수
- `user_name`, `user_email`을 `orders` 테이블에 중복 저장 → FK로 대체
- status를 `varchar`로 쓰다가 오타 → enum으로 대체
- 검색 대상 컬럼에 index 누락 → 쿼리 느려짐
- soft delete 쓰는데 `deletedAt`에 index 없음 → `WHERE deleted_at IS NULL` 느려짐
