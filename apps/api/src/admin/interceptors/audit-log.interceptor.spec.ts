import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { UserRole } from '../../common/enums/role.enum';
import { AdminAction } from '../decorators/admin-action.decorator';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogEntry,
  IAuditLogRepository,
} from '../repositories/audit-log.repository.interface';
import { AuditLogInterceptor } from './audit-log.interceptor';

class TestController {
  @AdminAction('users.status.update', 'user')
  handler() {
    return undefined;
  }
}

class TestControllerNoMeta {
  handler() {
    return undefined;
  }
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

const makeContext = (
  TargetClass: new () => unknown,
  request: Record<string, unknown>,
): ExecutionContext => {
  const instance = new TargetClass();
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ statusCode: 200 }),
      getNext: () => undefined,
    }),
    getHandler: () => (instance as { handler: () => unknown }).handler,
    getClass: () => TargetClass,
  } as unknown as ExecutionContext;
};

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let repo: jest.Mocked<IAuditLogRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuditLogInterceptor,
        Reflector,
        { provide: AUDIT_LOG_REPOSITORY, useValue: { insert: jest.fn() } },
      ],
    }).compile();

    interceptor = module.get(AuditLogInterceptor);
    repo = module.get(AUDIT_LOG_REPOSITORY);
  });

  it('@AdminAction 메타데이터 있을 때 INSERT 호출', async () => {
    repo.insert.mockResolvedValue(undefined);
    const ctx = makeContext(TestController, {
      user: { id: 'admin-1', role: UserRole.ADMIN, scope: ['admin'] },
      params: { id: '01HXX' },
      body: { role: 'admin' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    });
    const next: CallHandler = { handle: () => of('ok') };

    await firstValueFrom(interceptor.intercept(ctx, next));
    await flushMicrotasks();

    expect(repo.insert).toHaveBeenCalledTimes(1);
    const entry = repo.insert.mock.calls[0]![0];
    expect(entry).toMatchObject({
      adminUserId: 'admin-1',
      action: 'users.status.update',
      targetType: 'user',
      targetId: '01HXX',
      responseStatus: 200,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });

  it('@AdminAction 메타데이터 없으면 INSERT 호출 안 함', async () => {
    const ctx = makeContext(TestControllerNoMeta, {
      user: { id: 'admin-1' },
      params: {},
      body: {},
      headers: {},
    });
    const next: CallHandler = { handle: () => of('ok') };

    await firstValueFrom(interceptor.intercept(ctx, next));
    await flushMicrotasks();

    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('민감 필드는 마스킹된다', async () => {
    repo.insert.mockResolvedValue(undefined);
    const ctx = makeContext(TestController, {
      user: { id: 'admin-1' },
      params: { id: '01HXX' },
      body: {
        password: 'secret123',
        accessToken: 'eyJhbG...',
        nested: { refresh_token: 'r1', name: 'kim' },
      },
      headers: {},
    });
    const next: CallHandler = { handle: () => of('ok') };

    await firstValueFrom(interceptor.intercept(ctx, next));
    await flushMicrotasks();

    const entry = repo.insert.mock.calls[0]![0] as AuditLogEntry;
    expect(entry.requestBody).toEqual({
      password: '***',
      accessToken: '***',
      nested: { refresh_token: '***', name: 'kim' },
    });
  });

  it('INSERT 실패해도 응답에는 영향 없다', async () => {
    repo.insert.mockRejectedValue(new Error('db down'));
    const ctx = makeContext(TestController, {
      user: { id: 'admin-1' },
      params: { id: '01HXX' },
      body: {},
      headers: {},
    });
    const next: CallHandler = { handle: () => of('ok') };

    const result = await firstValueFrom(interceptor.intercept(ctx, next));
    await flushMicrotasks();

    expect(result).toBe('ok');
    expect(repo.insert).toHaveBeenCalled();
  });

  it('handler가 예외를 던지면 INSERT 호출 안 함 (tap은 success만)', async () => {
    const ctx = makeContext(TestController, {
      user: { id: 'admin-1' },
      params: { id: '01HXX' },
      body: {},
      headers: {},
    });
    const next: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    await expect(
      lastValueFrom(interceptor.intercept(ctx, next)),
    ).rejects.toThrow('boom');

    expect(repo.insert).not.toHaveBeenCalled();
  });
});
