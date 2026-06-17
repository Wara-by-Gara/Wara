# 04. Drizzle + PostgreSQL

> Drizzle은 "TypeScript로 SQL을 직접 쓰는 느낌"의 ORM이다. Prisma·TypeORM과 무엇이 다른지부터.

---

## 1. 왜 Drizzle인가

### 다른 옵션과 비교

| | Drizzle | Prisma | TypeORM |
|---|---|---|---|
| 스키마 | TS 파일 (`.ts`) | 별도 `.prisma` DSL | TS 데코레이터 |
| 마이그레이션 | SQL 파일 + journal | Prisma Migrate | TypeORM CLI |
| 쿼리 작성 | SQL스러운 query builder | 객체 API | repository + query builder |
| 타입 추론 | $inferSelect 등 자동 | 자동 | 약함 |
| 런타임 비용 | 매우 가벼움 | Rust 쿼리 엔진(별도 프로세스) | 무거움 |
| Edge 호환성 | ✅ | △ (개선 중) | ❌ |

### WARA가 Drizzle을 고른 이유
- **SQL 스타일**: 팀이 SQL 친숙 → 학습 비용 작음
- **빠름, 가벼움**: 런타임 오버헤드 없음
- **타입 추론 정확**: `users.$inferSelect`로 row 타입을 직접 얻음
- **postgres-js 드라이버** 잘 지원

---

## 2. 전체 그림

```
apps/api/
├── src/database/
│   ├── database.module.ts    # Drizzle 인스턴스 (@Inject(DRIZZLE))
│   └── schema/
│       ├── index.ts          # 모든 스키마 re-export
│       ├── users.ts
│       ├── invitations.ts
│       ├── enums.ts
│       └── ... (20개+ 도메인 스키마)
└── drizzle/
    ├── migrations/
    │   ├── 0000_curious_toad.sql  # 단일 baseline
    │   └── meta/_journal.json     # 적용 이력
    ├── run-migrations.ts          # 자체 hash 기반 마이그레이션 러너
    └── seed/
        ├── index.ts
        ├── seed-essential.ts      # 약관·템플릿 같은 필수 데이터
        └── purge-fixture-seed.ts  # fixture 정리
```

---

## 3. 스키마 작성

`apps/api/src/database/schema/users.ts:5`:
```ts
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  email: varchar('email', { length: 255 }),
  profileImageUrl: text('profile_image_url'),
  name: varchar('name', { length: 100 }),
  nickname: varchar('nickname', { length: 20 }),
  role: userRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;     // 행 타입 (SELECT 결과)
export type NewUser = typeof users.$inferInsert;  // INSERT용 타입
```

### 핵심 포인트

#### (1) `pgTable(name, columns, ...constraints)`
- 첫 인자: 실제 DB 테이블 이름 (snake_case)
- 둘째: 컬럼 객체
- 셋째(선택): 인덱스/체크 제약 배열

#### (2) 컬럼 타입
- `text`, `varchar({length})`, `integer`, `boolean`, `timestamp({withTimezone})`, `jsonb`, `pgEnum`

#### (3) ID는 ULID
- UUID v4보다 정렬 가능 + 시간순 → 인덱스 친화적
- `$defaultFn(() => ulid())`로 클라이언트 측에서 생성

#### (4) `$inferSelect` / `$inferInsert`
- 별도 타입 정의 없이 스키마에서 자동 추론
- 어디서나 import해서 `User` 같은 타입으로 사용

### 인덱스·체크 제약 (3번째 인자)
`invitations.ts:57`:
```ts
}, (t) => [
  check('check_cover_type_image', sql`${t.mainCoverType} <> 'image' OR (${t.mainImageKey} IS NOT NULL AND ${t.mainGifUrl} IS NULL)`),
  index('idx_invitations_user_id').on(t.userId),
  index('idx_invitations_public_explore').on(t.isPublic, t.category),
]);
```

`participants.ts`:
```ts
}, (t) => [
  uniqueIndex('uq_participants_user_invitation').on(t.userId, t.invitationId),
  index('idx_participants_invitation_id').on(t.invitationId),  // leftmost 규칙 때문에 단독 인덱스 추가
]);
```

### 관계 (foreign key)
```ts
userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
```

`relations.ts`에 join을 위한 relation 정의도 따로:
```ts
export const usersRelations = relations(users, ({ many }) => ({
  invitations: many(invitations),
}));
```

---

## 4. Drizzle 인스턴스 (DI에 주입)

`database.module.ts:7`:
```ts
export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [{
    provide: DRIZZLE,
    inject: [ConfigService],
    useFactory: (configService) => {
      const url = configService.getOrThrow<string>('DATABASE_URL');
      const client = instrumentPostgresClient(postgres(url));
      return drizzle(client, { schema, casing: 'snake_case' });
    },
  }],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
```

- `postgres(url)`: `postgres-js` 드라이버로 연결 풀 생성
- `instrumentPostgresClient`: 쿼리 시간 측정용 래퍼 (dev 환경 X-DB-Time 헤더)
- `casing: 'snake_case'`: TS는 camelCase, DB는 snake_case 자동 변환
- `DrizzleTx`: 트랜잭션 콜백 인자 타입 (Repository에서 트랜잭션 전달용)

### Repository에서 사용
```ts
@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findUser(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }
}
```

---

## 5. 쿼리 작성

### Select
```ts
import { eq, and, gt } from 'drizzle-orm';

// 단순 조회
const user = await db.select().from(users).where(eq(users.id, id));

// query API (relations 활용)
const user = await db.query.users.findFirst({
  where: eq(users.id, id),
  with: { invitations: true },  // join
});

// 조건 결합
const list = await db.select()
  .from(invitations)
  .where(and(eq(invitations.userId, userId), gt(invitations.createdAt, since)))
  .limit(20);
```

### Insert / Update / Delete
```ts
await db.insert(users).values({ email, nickname });

await db.update(users)
  .set({ nickname: 'new' })
  .where(eq(users.id, id));

await db.delete(users).where(eq(users.id, id));
```

> Hard delete 금지 (루트 CLAUDE.md). Soft delete = `deletedAt` 채움.

### 트랜잭션
```ts
await db.transaction(async (tx) => {
  await tx.insert(invitations).values(...);
  await tx.insert(participants).values(...);
});
```
중간에 throw하면 자동 롤백.

### 낙관적 락 (예: invitations 업데이트)
```ts
const result = await db.update(invitations)
  .set({ title, updatedAt: new Date() })
  .where(and(eq(invitations.id, id), eq(invitations.updatedAt, expectedUpdatedAt)))
  .returning();

if (result.length === 0) {
  throw new ConflictException({ code: ErrorCode.INVITATION_VERSION_CONFLICT });
}
```
→ 자세히는 [08. 초대장 도메인](./08-invitations.md).

---

## 6. 마이그레이션 — `run-migrations.ts` 방식

### Drizzle 기본 흐름
1. 스키마 수정 (`schema/*.ts`)
2. `pnpm db:generate` → SQL diff를 `drizzle/migrations/0001_xxx.sql`로 생성
3. `pnpm db:migrate` → SQL 적용

### WARA의 자체 러너 (왜?)
공식 `drizzle-kit migrate`가 **silent fail**한 적이 있어서 (spinner가 에러를 가림) 직접 hash 기반 러너로 교체.

**파일**: `apps/api/drizzle/run-migrations.ts` (168줄)

흐름:
1. `meta/_journal.json` 읽어 적용된 마이그레이션 목록 확인
2. 미적용 SQL 파일을 statement별로 분리해 적용
3. 적용 후 journal 갱신

### 최근 변경 (2026-06-13 기준)
- 마이그레이션 0000~0026 → 단일 `0000_curious_toad.sql`로 squash (baseline)
- 운영 환경에선 `db-migrate-production.sh` 스크립트가 dotenv 로드 후 실행

### 스크립트 매핑 (`apps/api/package.json:14`)
```bash
pnpm --filter @wara/api db:generate         # 스키마 diff → SQL 생성
pnpm --filter @wara/api db:migrate          # 마이그레이션 적용 (dev)
pnpm --filter @wara/api db:migrate:production # 운영용 (EC2에서 실행)
pnpm --filter @wara/api db:studio           # 웹 UI로 DB 보기
pnpm --filter @wara/api db:seed             # 시드 데이터
pnpm --filter @wara/api db:seed:essential   # 약관·템플릿 등 필수만
pnpm --filter @wara/api db:purge-fixture-seed # 픽스처 정리
```

---

## 7. 시드 데이터

`apps/api/drizzle/seed/seed-essential.ts`:
- 약관(`docs/legal/*.md`)을 frontmatter 파싱해 DB로 동기화
- 초대장 템플릿 (slug 기반)
- 운영 환경 1회 실행 + 약관 버전 변경 시 재실행

`drizzle/seed/index.ts`는 dev 픽스처(가짜 유저·초대장) 포함. 운영엔 절대 적용하면 안 됨.

---

## 8. 흔한 함정

### `schema/index.ts`에 export 빠뜨림
`db.query.users`가 undefined가 됨. 새 스키마 파일 만들면 `index.ts`에 re-export 필수.

### Relation 인덱스 빠뜨림
복합 unique `(user_id, invitation_id)`는 leftmost rule상 `invitation_id` 단독 조회에 못 씀. `participants.ts:79` 같은 패턴으로 별도 인덱스를 둔다.

### 트랜잭션 안에서 외부 service 호출
S3 업로드를 트랜잭션 안에서 하면 DB lock이 길어짐. 트랜잭션은 DB 작업만으로 짧게.

### Migration squash 후 운영 적용
운영 DB는 이미 0001~0026이 적용된 상태. squash된 새 baseline을 그대로 적용하면 안 됨 → journal만 갱신하거나 별도 절차.

→ 6번 챕터의 마이그레이션 커밋 8건이 정확히 그 작업.

---

## 9. 체크리스트

- [ ] `pgTable`로 스키마 정의 + `$inferSelect`로 타입 얻을 수 있다
- [ ] `@Inject(DRIZZLE)`로 DI 받는 패턴을 안다
- [ ] `db.select`, `db.query`, `db.transaction`을 구분한다
- [ ] 마이그레이션 사이클(`generate` → `migrate`)을 안다
- [ ] WARA가 왜 `drizzle-kit migrate` 대신 자체 러너를 쓰는지 안다

→ 다음: [05. 인증 시스템](./05-auth.md)
