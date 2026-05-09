# Drizzle ORM — SQLite Reference

## Import
```ts
import {
  sqliteTable,
  // Numeric
  integer, real, numeric,
  // Text
  text,
  // Blob
  blob,
  // Constraints
  primaryKey, unique, index, uniqueIndex,
} from 'drizzle-orm/sqlite-core';
```

## 컬럼 타입 치트시트

SQLite는 타입이 단순하다: `integer`, `real`, `text`, `blob`, `numeric`

| 용도 | Drizzle 타입 | 예시 |
|------|-------------|------|
| PK (자동 증가) | `integer` | `integer('id').primaryKey({ autoIncrement: true })` |
| 문자열 | `text` | `text('name').notNull()` |
| 참/거짓 | `integer` (0/1) | `integer('is_active', { mode: 'boolean' }).notNull().default(true)` |
| 타임스탬프 | `integer` | `integer('created_at', { mode: 'timestamp' }).notNull().default(sql\`(unixepoch())\`)` |
| JSON | `text` | `text('metadata', { mode: 'json' })` |

## 전체 패턴 예시
```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

## ⚠️ SQLite 주의사항
- SQLite는 `ALTER TABLE ADD COLUMN`만 지원 → Drizzle migrate 주의
- boolean, date는 네이티브 타입 없음 → `mode` 옵션으로 JS 레벨 변환
- 주로 로컬/임베디드 앱, Cloudflare D1, Turso에서 사용
