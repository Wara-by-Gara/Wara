# Wara API 개발 가이드

## 개요

이 가이드는 두 가지를 설명합니다:
1. **새 도메인 API를 만드는 방법** — `participants_example`을 템플릿으로 사용
2. **공용 유틸리티(`common/`)가 뭐 하는 것**인지

---

## Part 1: API 만드는 패턴 (participants_example)

### 폴더 구조

```
src/participants_example/
├── participants-example.module.ts          # DI 설정
├── participants-example.controller.ts      # HTTP 진입점
├── participants-example.service.ts         # 비즈니스 로직
├── participants-example.repository.ts      # DB 쿼리
└── dto/
    ├── join-invitation.dto.ts              # POST 검증 스키마
    └── update-rsvp.dto.ts                  # PATCH 검증 스키마
```

**핵심 원칙**: Controller → Service → Repository → DB  
각 계층은 자신의 책임만 지고, 아래 계층에 위임한다.

---

### Layer 1: Controller (HTTP 계층)

**책임**: HTTP 요청 받기, 파라미터 검증, 응답 반환

```typescript
// participants-example.controller.ts
@Controller('invitations/:invitationId/participants-example')
export class ParticipantsExampleController {
  constructor(private readonly service: ParticipantsExampleService) {}

  @Get()
  findAll(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.findAll(invitationId);
  }
}
```

**사용되는 데코레이터 & 파이프**:
- `@Controller('경로')` — 이 Controller가 처리할 URL 설정 (복수형 소문자)
- `@Param('id', ParseUlidPipe)` — URL 파라미터 추출 + ULID 형식 검증 (틀리면 자동 400)
- `@Body(new ZodValidationPipe(Schema))` — JSON body 검증 (Zod 스키마)
- `@UseGuards(JwtAuthGuard)` — JWT 토큰 필수 (없으면 자동 401)
- `@CurrentUser()` — 토큰에서 유저 정보 추출 (`{ id, role }`)
- `@HttpCode(HttpStatus.NO_CONTENT)` — DELETE 성공 시 204 + 빈 응답

**규칙**:
- 데이터만 return. 응답 래핑(`{ success: true, data }`)은 `ResponseFormatInterceptor`가 자동 처리
- 에러는 직접 throw. 형식 변환(`{ success: false, statusCode, message }`)은 `HttpExceptionFilter`가 자동 처리
- 소유권 체크 같은 비즈니스 로직은 Controller에 쓰지 않기 (Service에 위임)

---

### Layer 2: Service (비즈니스 로직)

**책임**: 데이터 조회·검증·조작, 도메인 규칙 구현

```typescript
// participants-example.service.ts
@Injectable()
export class ParticipantsExampleService {
  constructor(private readonly repository: ParticipantsExampleRepository) {}

  async join(userId: string, invitationId: string) {
    // 1. 데이터 존재 확인
    const existing = await this.repository.findByUserAndInvitation(userId, invitationId);
    
    // 2. 비즈니스 규칙 확인 (중복 참가 불가)
    if (existing) {
      throw new ConflictException('이미 이 초대장에 참가했습니다');
    }
    
    // 3. DB에 저장 위임
    return this.repository.create({ userId, invitationId });
  }
}
```

**사용되는 예외**:
- `NotFoundException` (404) — 찾는 데이터 없을 때
- `ConflictException` (409) — 비즈니스 규칙 위반 (중복, 중복 예약 등)
- `ForbiddenException` (403) — 소유권 없을 때
- `BadRequestException` (400) — 입력값 잘못됨

**규칙**:
- DB 쿼리는 절대 여기서 하지 않기 (Repository에 위임)
- 데이터만 return (예: `{ id, userId, rsvpStatus }`)
- 다른 도메인 테이블 쓰려면, 해당 도메인 Service 주입해서 호출

---

### Layer 3: Repository (DB 계층)

**책임**: Drizzle ORM으로 DB 쿼리 실행

```typescript
// participants-example.repository.ts
@Injectable()
export class ParticipantsExampleRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: { userId: string; invitationId: string }) {
    const result = await this.db
      .insert(schema.participants)
      .values({ ...data, memberRole: 'GUEST' })
      .returning();
    return result[0];
  }
}
```

**규칙**:
- `@Inject(DRIZZLE)` — `DatabaseModule`에서 제공하는 DB 인스턴스
- 모든 쿼리는 여기서만 (Service는 직접 DB 접근 금지)
- 쿼리 로직 바꾸려면 이 파일만 수정 (캐시 추가, 성능 개선 등)

---

### Layer 4: DTO & Zod 스키마

**책임**: 입력값 형식 정의, 타입 안전성

```typescript
// dto/update-rsvp.dto.ts
export const UpdateRsvpSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent', 'cancelled']),
});

export type UpdateRsvpDto = z.infer<typeof UpdateRsvpSchema>;
```

**사용**:
```typescript
// Controller에서:
@Body(new ZodValidationPipe(UpdateRsvpSchema)) dto: UpdateRsvpDto
```

**규칙**:
- `z.object({ ... })` — body 필드 정의
- `z.enum(['...'])` — 정해진 값만 허용 (SKILL 규칙)
- `z.infer<>` — Zod 스키마에서 TypeScript 타입 추출
- 빈 DTO는 `z.object({})`

---

### Module 설정

```typescript
// participants-example.module.ts
@Module({
  controllers: [ParticipantsExampleController],
  providers: [ParticipantsExampleService, ParticipantsExampleRepository],
})
export class ParticipantsExampleModule {}
```

**규칙**:
- Controller + Service + Repository만 등록
- DatabaseModule은 @Global이라 import 불필요
- DRIZZLE 토큰은 Repository의 @Inject로 자동 주입

---

## Part 2: Common 유틸리티 상세 설명

### 2-1. Types (`common/types/`)

#### `jwt-payload.type.ts`
JWT 토큰에 포함된 유저 정보의 타입 정의.

```typescript
export type JwtPayload = {
  id: string;
  role: string;
};
```

**사용**:
```typescript
// @CurrentUser()로 꺼낼 때
@CurrentUser() user: JwtPayload  // any 대신 이거 사용
```

**이점**: `user.id`, `user.role` 접근할 때 타입 체크, 자동완성 지원

---

### 2-2. Guards (`common/guards/`)

#### `jwt-auth.guard.ts`
JWT 토큰 검증 가드. 토큰 없거나 유효하지 않으면 401.

```typescript
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**사용**:
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

**흐름**:
1. 요청에 `Authorization: Bearer <token>` 헤더 필요
2. JwtAuthGuard가 토큰 검증
3. 유효하면 `request.user = { id, role }` 설정
4. @CurrentUser()로 접근 가능

#### `roles.guard.ts`
역할 기반 접근 제어 (RBAC). @Roles() 데코레이터와 함께 사용.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)  // 순서 중요: JWT 먼저
@Roles('admin', 'host')
@Delete('participants/:id')
delete() { ... }
```

**규칙**:
- JwtAuthGuard 다음에 RolesGuard 적용
- @Roles 데코레이터 없으면 모든 인증된 유저 통과
- `user.role` (회원/관리자)와 초대장 내 `memberRole` (HOST/GUEST) 다름 주의

---

### 2-3. Decorators (`common/decorators/`)

#### `@CurrentUser()`
JWT 토큰에서 유저 정보 추출하는 파라미터 데코레이터.

```typescript
@Get('me')
getMe(@CurrentUser() user: JwtPayload) {
  return { id: user.id, role: user.role };
}
```

**동작**: `request.user`를 파라미터로 주입. JwtAuthGuard와 함께만 동작.

#### `@Roles(...roles: string[])`
라우트에 필요한 역할 설정. RolesGuard와 함께 사용.

```typescript
@Roles('admin')
@Delete('admin/settings')
deleteSettings() { ... }
```

---

### 2-4. Pipes (`common/pipes/`)

#### `ParseUlidPipe`
URL 파라미터 ULID 형식 검증. 틀리면 자동 400 반환.

```typescript
@Get(':id')
findOne(@Param('id', ParseUlidPipe) id: string) {
  return this.service.findOne(id);
}
```

**ULID 형식**: 26자리 Crockford Base32  
**잘못된 예**: `123`, `abc-def`, `uuid-uuid-uuid`  
**올바른 예**: `01ARZ3NDEKTSV4RRFFQ69G5FAV` (26자리 숫자+대문자)

#### `ZodValidationPipe`
Zod 스키마로 body/query/param 검증.

```typescript
@Post()
create(
  @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto
) {
  return this.service.create(dto);
}
```

**검증 실패 시**: 400 + Zod 에러 메시지

---

### 2-5. Interceptors (`common/interceptors/`)

#### `ResponseFormatInterceptor`
모든 성공 응답을 자동으로 래핑.

```typescript
// Service가 반환:
{ id: '01ARZ3N', userId: '01ARZ3N', rsvpStatus: 'attending' }

// 클라이언트가 받음:
{
  "success": true,
  "data": {
    "id": "01ARZ3N",
    "userId": "01ARZ3N",
    "rsvpStatus": "attending"
  }
}
```

**등록**: `main.ts`에서 `app.useGlobalInterceptors(new ResponseFormatInterceptor())`

---

### 2-6. Filters (`common/filters/`)

#### `AllExceptionsFilter`
모든 예외를 `{ success: false, statusCode, message }` 형식으로 변환.

**처리하는 예외**:
- DB 연결 끊김
- 런타임 에러 (null 참조 등)
- 예상 못한 에러
→ 모두 500 + 동일 형식으로 반환

#### `HttpExceptionFilter`
NestJS HttpException (NotFoundException, ForbiddenException 등)을 처리.

**동작**:
```typescript
throw new ForbiddenException('자신의 데이터만 수정 가능');
// ↓
{
  "success": false,
  "statusCode": 403,
  "message": "자신의 데이터만 수정 가능"
}
```

**등록**: `main.ts`에서  
```typescript
app.useGlobalFilters(
  new AllExceptionsFilter(),    // 넓음 (모든 예외)
  new HttpExceptionFilter()      // 좁음 (HttpException만)
)
```

**순서 중요**: AllExceptionsFilter가 먼저 실행되어 안전망 역할

---

## Part 3: 새 도메인 만들기 (Step by Step)

### 1단계: 폴더 구조 생성

```bash
mkdir -p src/users/dto
touch src/users/{users.module,users.controller,users.service,users.repository}.ts
touch src/users/dto/{create-user,update-user}.dto.ts
```

### 2단계: Repository 작성

```typescript
// src/users/users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: { email: string; name: string }) {
    const result = await this.db
      .insert(schema.users)
      .values(data)
      .returning();
    return result[0];
  }
}
```

### 3단계: Service 작성

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async findOne(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    return this.repository.create(dto);
  }
}
```

### 4단계: Controller 작성

```typescript
// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseUlidPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto) {
    return this.service.create(dto);
  }
}
```

### 5단계: DTO 작성

```typescript
// src/users/dto/create-user.dto.ts
export const CreateUserSchema = z.object({
  email: z.string().email('유효한 이메일 주소여야 합니다'),
  name: z.string().min(1, '이름은 필수입니다'),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

### 6단계: Module 등록

```typescript
// src/users/users.module.ts
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
```

### 7단계: AppModule에 등록

```typescript
// src/app.module.ts
@Module({
  imports: [
    // ...
    UsersModule,  // 추가
  ],
})
export class AppModule {}
```

### 8단계: 빌드 확인

```bash
pnpm --filter @wara/api build
```

---

## Part 4: 체크리스트

### 새 도메인 만들 때 확인사항

- [ ] Controller 경로가 복수형 소문자인가? (`/users`, `/posts` 등)
- [ ] 모든 `:id` 파라미터에 `ParseUlidPipe` 적용했는가?
- [ ] 인증이 필요한 엔드포인트에 `@UseGuards(JwtAuthGuard)` 붙였는가?
- [ ] body 검증이 필요한 엔드포인트에 `ZodValidationPipe` 적용했는가?
- [ ] 소유권 체크가 필요하면 Service에 로직이 있는가?
- [ ] Repository에만 Drizzle 쿼리가 있는가?
- [ ] DTO에 Zod 스키마가 있는가?
- [ ] Module에 Controller, Service, Repository가 등록되어 있는가?
- [ ] AppModule에 이 모듈이 import되어 있는가?

### 코드 리뷰 체크리스트

- [ ] `any` 타입 대신 `JwtPayload` 사용하는가?
- [ ] `throw`한 예외가 명확한가? (NotFoundException, ForbiddenException 등)
- [ ] Service가 직접 DB 접근하지 않는가?
- [ ] 다른 도메인 테이블 쓸 때 해당 Service 주입하는가?
- [ ] DELETE 엔드포인트가 204 반환하는가? (`@HttpCode(204)`)

---

## Part 5: 자주 묻는 것들 (FAQ)

### Q. 왜 Repository가 필요한가?
**A.** Service가 데이터 조작 로직을 몰라도 되기 때문. 캐시를 추가하거나 쿼리를 최적화할 때 Repository만 수정하면 된다.

### Q. 언제 Service에서 다른 도메인 Service를 호출하는가?
**A.** 자신의 도메인이 아닌 테이블을 쓸 때. 예: `ParticipantsService`가 `users` 테이블 업데이트 → `UsersService`에 위임.

### Q. @CurrentUser()가 안 작동하는데?
**A.** `@UseGuards(JwtAuthGuard)` 없어서. JWT 토큰이 검증되어야만 `request.user`가 설정된다.

### Q. 404를 반환하려면?
**A.** `throw new NotFoundException('메시지')`. HttpExceptionFilter가 자동으로 404로 변환.

### Q. Zod 검증 실패 시 뭐가 반환되는가?
**A.** 400 + Zod 에러 포맷 (필드별 에러 메시지).

---

## Part 6: 모든 도메인의 기본 DTO 목록

### 각 도메인별로 준비된 DTO

모든 도메인이 동일한 Zod 패턴을 따릅니다. 다음은 현재 구현된 DTO 목록입니다:

| 도메인 | 파일 | 용도 |
|--------|------|------|
| **auth** | `social-login.dto.ts` | 소셜 로그인 (kakao/naver/apple) |
| **users** | `update-user.dto.ts` | 프로필 수정 (nickname, name, birthYear, gender, profileImageUrl) |
| **invitations** | `create-invitation.dto.ts` | 초대장 생성 (title, description, mainImageKey, templateId, eventStartAt, isMissionEnabled) |
|  | `update-invitation.dto.ts` | 초대장 수정 (위 필드 모두 optional) |
| **participants** | `join-invitation.dto.ts` | 초대장 참가 (빈 body) |
|  | `update-rsvp.dto.ts` | RSVP 상태 수정 (attending/undecided/absent/cancelled) |
| **templates** | `create-template.dto.ts` | 템플릿 생성 (name, previewImageKey, theme, font, effect, isActive) |
|  | `update-template.dto.ts` | 템플릿 수정 (위 필드 모두 optional) |
| **locations** | `set-event-location.dto.ts` | 행사 위치 설정 (address, placeName, detailAddress, lat, lng, placeId) |
|  | `update-participant-location.dto.ts` | 참가자 위치 업데이트 (lat, lng, accuracy, isArrived) |
| **missions** | `create-mission.dto.ts` | 미션 생성 (content) |
| **photos** | `upload-photo.dto.ts` | 사진 업로드 (imageKey) |
| **feedbacks** | `create-feedback.dto.ts` | 피드백 생성 (content, invitationId\|photoId, parentId) |
|  | `update-feedback.dto.ts` | 피드백 수정 (content만) |
| **notifications** | `update-notification.dto.ts` | 알림 읽음 표시 (isRead) |
|  | `update-notification-settings.dto.ts` | 알림 설정 (isRemind, isFeedback, isInvitationDate, isPhoto, isMission, isParticipantLocations, isEventLocations) |

### DTO 사용 패턴

모든 DTO는 동일한 구조를 따릅니다:

```typescript
// src/xxx/dto/yyy.dto.ts
import { z } from 'zod';

export const YyySchema = z.object({
  field1: z.string().min(1),
  field2: z.number().optional(),
  field3: z.enum(['value1', 'value2']).optional(),
});

export type YyyDto = z.infer<typeof YyySchema>;
```

**Controller에서 사용**:
```typescript
@Post()
create(
  @Body(new ZodValidationPipe(YyySchema)) dto: YyyDto
) {
  return this.service.create(dto);
}
```

### DTO 설계 원칙

1. **CREATE DTO** — 클라이언트가 반드시 입력해야 하는 필드만
2. **UPDATE DTO** — 수정 가능한 필드는 모두 optional (PATCH 의미론)
3. **열거형 값** — Drizzle과 분리해서 Zod에 직접 정의
4. **Validation** — 좌표 범위(lat -90~90, lng -180~180), 숫자 범위(accuracy >= 0) 등 포함
5. **조건부 필드** — 예: feedbacks의 `invitationId | photoId` (둘 중 하나 필수) → `.refine()` 사용

---

## 참고 자료

- **Drizzle ORM**: https://orm.drizzle.team (쿼리 문법)
- **Zod**: https://zod.dev (DTO 검증)
- **NestJS**: https://nestjs.com (프레임워크)

---

**마지막 팁**: participants_example을 복사해서 클래스명·경로만 바꾸면 70% 완성된다. 그 후 Service의 비즈니스 로직과 DTO를 자신의 도메인에 맞게 수정하면 된다.