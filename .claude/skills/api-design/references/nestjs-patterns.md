# NestJS 심화 패턴

## Guard (인증 & 인가)

### JwtAuthGuard

```ts
// common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다' });

    try {
      req.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: '토큰이 유효하지 않습니다' });
    }
  }
}
```

### RolesGuard

```ts
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: '접근 권한이 없습니다' });
    }
    return true;
  }
}
```

### app.module.ts에 글로벌 등록

```ts
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },  // 전체 라우트 JWT 인증
    { provide: APP_GUARD, useClass: RolesGuard },    // 순서 중요: JWT → Roles
  ],
})
export class AppModule {}
```

---

## Decorator (커스텀 데코레이터)

```ts
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// common/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
  },
);

// 사용 예시
@Get('me')
getMe(@CurrentUser() user: JwtPayload) { return ok(user); }

@Delete(':id')
@Roles('admin')
remove(@Param('id') id: string, @CurrentUser('sub') userId: string) { ... }

@Post('/auth/login')
@Public()   // JWT Guard 우회
login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) { ... }
```

---

## Interceptor

### ResponseInterceptor — Envelope 자동 래핑

컨트롤러에서 `ok(data)` / `list(data, meta)`를 직접 반환하면 충분하지만,
단순 객체 반환 시에도 자동 Envelope 처리가 필요하다면 인터셉터를 사용한다.

```ts
// common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        if (data && 'success' in data) return data;  // 이미 Envelope이면 통과
        return { success: true, data };
      }),
    );
  }
}
```

### LoggingInterceptor — 요청/응답 로깅

```ts
// common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${url} ${Date.now() - start}ms [${user?.sub ?? 'anonymous'}]`),
        error: (err) => this.logger.error(`${method} ${url} ${Date.now() - start}ms ERROR: ${err.message}`),
      }),
    );
  }
}
```

---

## Module 구조 패턴

### Feature Module (도메인 단위)

```ts
// users/users.module.ts
@Module({
  controllers: [UsersController],
  providers:   [UsersService],
  exports:     [UsersService],   // 다른 모듈에서 주입받을 수 있도록
})
export class UsersModule {}
```

### Global Common Module

```ts
// common/common.module.ts
@Global()   // 한 번만 import하면 전체 모듈에서 사용 가능
@Module({
  providers: [JwtAuthGuard, RolesGuard, LoggingInterceptor],
  exports:   [JwtAuthGuard, RolesGuard, LoggingInterceptor],
})
export class CommonModule {}
```

---

## Swagger (OpenAPI 자동화)

```bash
npm i @nestjs/swagger
```

```ts
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
```

```ts
// DTO에 Swagger 데코레이터 추가
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '홍길동', minLength: 2, maxLength: 50 })
  name: string;

  @ApiPropertyOptional({ enum: ['admin', 'user'], default: 'user' })
  role?: 'admin' | 'user';
}

// Controller에 API 문서 주석
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: '유저 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @Get()
  findAll() { ... }

  @ApiOperation({ summary: '유저 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '입력값 오류' })
  @Post()
  create() { ... }
}
```

---

## NestJS 예외 클래스 치트시트

`AppError` 대신 NestJS 내장 예외를 사용한다. GlobalExceptionFilter가 모두 처리한다.

```ts
import {
  BadRequestException,          // 400
  UnauthorizedException,        // 401
  ForbiddenException,           // 403
  NotFoundException,            // 404
  ConflictException,            // 409
  UnprocessableEntityException, // 422
  InternalServerErrorException, // 500
} from '@nestjs/common';

// code + message 함께 전달 → GlobalExceptionFilter가 파싱
throw new NotFoundException({ code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다' });
throw new ConflictException({ code: 'CONFLICT', message: '이미 사용 중인 이메일입니다' });
throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: '토큰이 만료되었습니다' });
```
