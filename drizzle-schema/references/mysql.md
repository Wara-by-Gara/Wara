# Drizzle ORM — MySQL Reference

## Import
```ts
import {
  mysqlTable, mysqlEnum,
  // Numeric
  int, bigint, smallint, tinyint, float, double, decimal,
  // Text
  varchar, text, char, tinytext, mediumtext, longtext,
  // Boolean
  boolean, tinyint,
  // Date/Time
  datetime, date, time, timestamp, year,
  // JSON
  json,
  // Constraints
  primaryKey, unique, index, uniqueIndex,
} from 'drizzle-orm/mysql-core';
```

## 컬럼 타입 치트시트

| 용도 | Drizzle 타입 | 예시 |
|------|-------------|------|
| PK (자동 증가) | `int` | `int('id').primaryKey().autoincrement()` |
| PK (UUID 문자열) | `varchar` | `varchar('id', { length: 36 }).primaryKey()` |
| 짧은 문자열 | `varchar` | `varchar('name', { length: 100 })` |
| 긴 텍스트 | `text` | `text('content')` |
| 참/거짓 | `boolean` | `boolean('is_active').notNull().default(true)` |
| 정수 | `int` | `int('count').notNull().default(0)` |
| 날짜+시각 | `datetime` | `datetime('created_at').notNull().default(sql\`NOW()\`)` |
| JSON | `json` | `json('metadata')` |

## ⚠️ MySQL 주의사항

1. **UUID**: MySQL에 `uuid()` 기본 함수가 없으므로 `varchar(36)` + 앱 레벨 UUID 생성 사용
2. **timestamp vs datetime**: `timestamp`는 2038년 문제 있음 → `datetime` 권장
3. **boolean**: 내부적으로 `tinyint(1)`로 저장됨

## Auto-increment PK
```ts
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
});
```

## Enum
```ts
export const statusEnum = mysqlEnum('status', ['active', 'inactive', 'banned']);

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  status: statusEnum.notNull().default('active'),
});
```

## 전체 패턴 예시
```ts
import { mysqlTable, mysqlEnum, int, varchar, text, datetime, boolean, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: datetime('created_at').notNull().default(sql`NOW()`),
  updatedAt: datetime('updated_at').notNull().default(sql`NOW() ON UPDATE NOW()`),
});
```
