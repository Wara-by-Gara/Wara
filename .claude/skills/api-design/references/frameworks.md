# Framework 세팅 & 패턴

## Hono (Edge / 경량)

**언제 선택**: Cloudflare Workers, Bun, Deno 등 Edge 환경; 초경량 서버; 빠른 프로토타이핑.

```ts
// app.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { usersRouter } from './routes/users';

const app = new Hono().basePath('/api/v1');

app.use('*', logger());
app.use('*', cors({ origin: process.env.ALLOWED_ORIGIN ?? '*' }));

app.route('/users', usersRouter);

// 글로벌 에러 핸들러
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(err('VALIDATION_ERROR', '입력값이 올바르지 않습니다', ...), 400);
  }
  console.error(err);
  return c.json(err('INTERNAL_ERROR', '서버 오류가 발생했습니다'), 500);
});

export default app;
```

```ts
// routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createUserSchema, listUsersSchema, updateUserSchema } from '../schemas/users.schema';
import { ok, list, err } from '../types/api';

const app = new Hono();

// 목록 조회
app.get('/', zValidator('query', listUsersSchema), async (c) => {
  const query = c.req.valid('query');
  const { data, total } = await usersService.list(query);
  return c.json(list(data, { total, page: query.page, limit: query.limit }));
});

// 단건 조회
app.get('/:id', async (c) => {
  const user = await usersService.findById(c.req.param('id'));
  if (!user) return c.json(err('NOT_FOUND', '유저를 찾을 수 없습니다'), 404);
  return c.json(ok(user));
});

// 생성
app.post('/', zValidator('json', createUserSchema), async (c) => {
  const body = c.req.valid('json');
  const user = await usersService.create(body);
  return c.json(ok(user), 201, { Location: `/api/v1/users/${user.id}` });
});

// 부분 수정
app.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  const body = c.req.valid('json');
  const user = await usersService.update(c.req.param('id'), body);
  if (!user) return c.json(err('NOT_FOUND', '유저를 찾을 수 없습니다'), 404);
  return c.json(ok(user));
});

// 삭제
app.delete('/:id', async (c) => {
  const exists = await usersService.delete(c.req.param('id'));
  if (!exists) return c.json(err('NOT_FOUND', '유저를 찾을 수 없습니다'), 404);
  return c.body(null, 204);
});

export { app as usersRouter };
```

---

## Express

**언제 선택**: 기존 Node.js 프로젝트, 넓은 생태계가 필요할 때, 팀에 Express 경험이 있을 때.

```ts
// app.ts
import express from 'express';
import 'express-async-errors';   // ← async 에러 자동 next() 전달
import { usersRouter } from './routes/users';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use('/api/v1/users', usersRouter);
app.use(errorHandler);  // ← 반드시 마지막에 등록

export default app;
```

```ts
// middlewares/validate.ts
import { AnyZodObject } from 'zod';
import type { RequestHandler } from 'express';

type Target = 'body' | 'query' | 'params';

export const validate = (schema: AnyZodObject, target: Target = 'body'): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) return next(result.error);  // ZodError → errorHandler
    req[target] = result.data;   // coerce된 값으로 덮어쓰기
    next();
  };
```

```ts
// routes/users.ts
import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { createUserSchema, listUsersSchema, updateUserSchema } from '../schemas/users.schema';

const router = Router();

router.get('/',    validate(listUsersSchema, 'query'), listUsers);
router.get('/:id', getUser);
router.post('/',   validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export { router as usersRouter };
```

```ts
// controllers/users.controller.ts
import type { RequestHandler } from 'express';
import { ok, list } from '../types/api';
import { AppError } from '../middlewares/errorHandler';

export const getUser: RequestHandler = async (req, res) => {
  const user = await usersService.findById(req.params.id);
  if (!user) throw new AppError(404, 'NOT_FOUND', '유저를 찾을 수 없습니다');
  res.json(ok(user));
};

export const createUser: RequestHandler = async (req, res) => {
  const user = await usersService.create(req.body);
  res.status(201).location(`/api/v1/users/${user.id}`).json(ok(user));
};

export const deleteUser: RequestHandler = async (req, res) => {
  const exists = await usersService.delete(req.params.id);
  if (!exists) throw new AppError(404, 'NOT_FOUND', '유저를 찾을 수 없습니다');
  res.status(204).end();
};
```

---

## Fastify

**언제 선택**: 높은 처리량이 필요할 때, 스키마 기반 직렬화로 성능 극대화, JSON Schema가 편할 때.

```ts
// app.ts
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Zod 타입 프로바이더 적용
app.withTypeProvider<ZodTypeProvider>();

await app.register(usersPlugin, { prefix: '/api/v1/users' });
```

```ts
// routes/users.ts (Fastify Plugin)
import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createUserSchema, listUsersSchema } from '../schemas/users.schema';
import { z } from 'zod';

const usersPlugin: FastifyPluginAsync = async (app) => {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.get('/', {
    schema: { querystring: listUsersSchema },
  }, async (req) => {
    const { data, total } = await usersService.list(req.query);
    return list(data, { total, page: req.query.page, limit: req.query.limit });
  });

  f.post('/', {
    schema: { body: createUserSchema },
  }, async (req, reply) => {
    const user = await usersService.create(req.body);
    reply.status(201).header('Location', `/api/v1/users/${user.id}`);
    return ok(user);
  });
};

export default usersPlugin;
```

---

## NestJS

**언제 선택**: 대규모 엔터프라이즈, 팀이 크고 컨벤션이 강력하게 필요할 때, DI/테스트 구조가 중요할 때.

```ts
// users/users.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(listUsersSchema)) query: ListUsersQuery) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

```ts
// common/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 올바르지 않습니다',
          details: exception.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }
      });
    }

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        success: false,
        error: { code: 'HTTP_ERROR', message: exception.message }
      });
    }

    console.error(exception);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
}
```
