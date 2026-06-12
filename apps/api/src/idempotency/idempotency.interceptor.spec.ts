import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
} from '@nestjs/common';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { ErrorCode } from '../common/constants/error-codes';
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
} from './idempotency.constants';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import type {
  CachedResponse,
  IdempotencyKeyParts,
  IdempotencyLookup,
  IdempotencyRedisStore,
} from './idempotency.redis-store';

const VALID_KEY = '01HZX7Y8K9NQRSTVWXYZABCDEF';

type MockStore = {
  [K in keyof IdempotencyRedisStore]: jest.Mock;
};

function createStore(): MockStore {
  return {
    find: jest.fn().mockResolvedValue(null),
    tryLock: jest.fn().mockResolvedValue(true),
    saveResponse: jest.fn().mockResolvedValue(undefined),
    releaseLock: jest.fn().mockResolvedValue(undefined),
  };
}

type Req = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  user?: { id?: string };
};

type Res = {
  statusCode: number;
  status: jest.Mock;
  setHeader: jest.Mock;
};

function createContext(req: Req, res: Res): ExecutionContext {
  const reqWithHelpers = {
    ...req,
    header: (name: string) => req.headers[name.toLowerCase()],
  };
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => reqWithHelpers,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

function createHandler(observable: Observable<unknown>): CallHandler {
  return { handle: () => observable };
}

function createReq(overrides: Partial<Req> = {}): Req {
  return {
    method: 'POST',
    path: '/invitations',
    headers: { [IDEMPOTENCY_KEY_HEADER]: VALID_KEY },
    user: { id: 'user_01' },
    ...overrides,
  };
}

function createRes(statusCode = 201): Res {
  const res: Res = {
    statusCode,
    status: jest.fn(),
    setHeader: jest.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

describe('IdempotencyInterceptor', () => {
  let store: MockStore;
  let interceptor: IdempotencyInterceptor;

  beforeEach(() => {
    store = createStore();
    interceptor = new IdempotencyInterceptor(
      store as unknown as IdempotencyRedisStore,
    );
  });

  it('GET 요청은 store를 거치지 않고 통과', async () => {
    const ctx = createContext(createReq({ method: 'GET' }), createRes(200));
    const handler = createHandler(of('ok'));
    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toBe('ok');
    expect(store.find).not.toHaveBeenCalled();
    expect(store.tryLock).not.toHaveBeenCalled();
  });

  it('Idempotency-Key 헤더 없으면 그대로 통과', async () => {
    const ctx = createContext(createReq({ headers: {} }), createRes());
    const handler = createHandler(of('ok'));
    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toBe('ok');
    expect(store.find).not.toHaveBeenCalled();
  });

  it('잘못된 형식 헤더는 400 VALIDATION_ERROR', async () => {
    const ctx = createContext(
      createReq({ headers: { [IDEMPOTENCY_KEY_HEADER]: 'short' } }),
      createRes(),
    );
    const handler = createHandler(of('ok'));
    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler)),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_ERROR },
    });
    expect(store.find).not.toHaveBeenCalled();
  });

  it('cache miss + lock 획득 + 2xx 응답이면 saveResponse 호출', async () => {
    store.find.mockResolvedValue(null);
    store.tryLock.mockResolvedValue(true);
    const res = createRes(201);
    const ctx = createContext(createReq(), res);
    const handler = createHandler(of({ ok: true }));

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toEqual({ ok: true });
    expect(store.saveResponse).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: VALID_KEY }),
      { status: 201, body: { ok: true } },
    );
    expect(store.releaseLock).not.toHaveBeenCalled();
  });

  it('cache hit이면 캐시된 응답 + Idempotency-Replayed 헤더', async () => {
    const cached: CachedResponse = { status: 201, body: { cached: 1 } };
    store.find.mockResolvedValue(cached as IdempotencyLookup);
    const res = createRes();
    const ctx = createContext(createReq(), res);
    const handler = createHandler(of('not-this'));

    const result = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(result).toEqual({ cached: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith(
      IDEMPOTENCY_REPLAYED_HEADER,
      'true',
    );
    expect(store.tryLock).not.toHaveBeenCalled();
  });

  it('처리 중(in_progress)이면 409 IDEMPOTENCY_IN_PROGRESS', async () => {
    store.find.mockResolvedValue('in_progress');
    const ctx = createContext(createReq(), createRes());
    const handler = createHandler(of('ok'));
    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler)),
    ).rejects.toMatchObject({
      message: ErrorCode.IDEMPOTENCY_IN_PROGRESS,
    });
  });

  it('find~tryLock race로 lock 실패하면 409', async () => {
    store.find.mockResolvedValue(null);
    store.tryLock.mockResolvedValue(false);
    const ctx = createContext(createReq(), createRes());
    const handler = createHandler(of('ok'));
    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('핸들러가 throw하면 releaseLock 후 에러 전파', async () => {
    store.find.mockResolvedValue(null);
    store.tryLock.mockResolvedValue(true);
    const err = new Error('boom');
    const ctx = createContext(createReq(), createRes());
    const handler = createHandler(throwError(() => err));

    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler)),
    ).rejects.toBe(err);
    expect(store.releaseLock).toHaveBeenCalled();
    expect(store.saveResponse).not.toHaveBeenCalled();
  });

  it('비-2xx 응답이면 캐시 저장 없이 락만 해제', async () => {
    store.find.mockResolvedValue(null);
    store.tryLock.mockResolvedValue(true);
    const res = createRes(400);
    const ctx = createContext(createReq(), res);
    const handler = createHandler(of({ partial: true }));

    await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(store.releaseLock).toHaveBeenCalled();
    expect(store.saveResponse).not.toHaveBeenCalled();
  });

  it('인증 없는 요청은 scope=anon으로 저장', async () => {
    store.find.mockResolvedValue(null);
    store.tryLock.mockResolvedValue(true);
    const ctx = createContext(
      createReq({ user: undefined }),
      createRes(201),
    );
    const handler = createHandler(of('ok'));
    await firstValueFrom(interceptor.intercept(ctx, handler));
    const parts: IdempotencyKeyParts = store.tryLock.mock.calls[0][0];
    expect(parts.scope).toBe('anon');
  });

  // BadRequestException은 ErrorCode 묶음으로 사용 — type 안정성 확인용 더미.
  it('BadRequestException 타입은 정상', () => {
    expect(new BadRequestException(ErrorCode.VALIDATION_ERROR)).toBeInstanceOf(
      BadRequestException,
    );
  });
});
