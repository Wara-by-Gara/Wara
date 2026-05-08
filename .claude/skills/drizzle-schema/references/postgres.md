# Drizzle ORM — PostgreSQL Reference

## Import
```ts
import {
  pgTable, pgEnum, pgSchema,
  // Numeric
  integer, bigint, smallint, decimal, real, doublePrecision, numeric,
  // Text
  varchar, text, char,
  // Boolean
  boolean,
  // UUID
  uuid,
  // Date/Time
  timestamp, date, time, interval,
  // JSON
  json, jsonb,
  // Array
  // (배열: column.array() 체이닝)
  // Constraints
  primaryKey, unique, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
```

## 컬럼 타입 치트시트

| 용도 | Drizzle 타입 | 예시 |
|------|-------------|------|
| PK (자동 UUID) | `uuid` | `uuid('id').primaryKey().defaultRandom()` |
| PK (자동 증가) | `integer` | `integer('id').primaryKey().generatedAlwaysAsIdentity()` |
| 짧은 문자열 | `varchar` | `varchar('name', { length: 100 })` |
| 긴 텍스트 | `text` | `text('content')` |
| 참/거짓 | `boolean` | `boolean('is_active').notNull().default(true)` |
| 정수 | `integer` | `integer('count').notNull().default(0)` |
| 큰 정수 | `bigint` | `bigint('views', { mode: 'number' })` |
| 소수 | `numeric` | `numeric('price', { precision: 10, scale: 2 })` |
| 생성 시각 | `timestamp` | `timestamp('created_at').notNull().defaultNow()` |
| 수정 시각 | `timestamp` | `timestamp('updated_at').notNull().defaultNow()` |
| 날짜만 | `date` | `date('birth_date')` |
| JSON 데이터 | `jsonb` | `jsonb('metadata')` |
| 배열 | `.array()` | `text('tags').array()` |

## timestamp 권장 설정
```ts
// withTimezone: 서버가 여러 timezone 처리할 때 필수
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
```

## Enum
```ts
export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
]);
```
> ⚠️ pgEnum은 반드시 테이블 정의보다 먼저 선언해야 한다.

## 복합 PK
```ts
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));
```

## 복합 Unique
```ts
export const follows = pgTable('follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id),
  followingId: uuid('following_id').notNull().references(() => users.id),
}, (t) => ({
  uniqueFollow: unique('unique_follow').on(t.followerId, t.followingId),
}));
```

## 복합 Index
```ts
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  status: statusEnum('status').notNull(),
  publishedAt: timestamp('published_at'),
}, (t) => ({
  userStatusIdx: index('posts_user_status_idx').on(t.userId, t.status),
  publishedAtIdx: index('posts_published_at_idx').on(t.publishedAt),
}));
```

## Self-referential (계층 구조)
```ts
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
  name: varchar('name', { length: 100 }).notNull(),
});
```
> ⚠️ 자기 참조 FK는 `(): AnyPgColumn =>` 타입 annotation이 필요하다.

## 전체 패턴 예시 — 블로그
```ts
import { pgTable, pgEnum, uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  content: text('content'),
  status: postStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  authorIdx: index('posts_author_id_idx').on(t.authorId),
  slugUniqueIdx: uniqueIndex('posts_slug_unique_idx').on(t.slug),
  statusPublishedIdx: index('posts_status_published_idx').on(t.status, t.publishedAt),
}));
```
