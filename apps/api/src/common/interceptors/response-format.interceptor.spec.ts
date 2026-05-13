import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { PaginatedResult } from '../types/paginated-result.type';
import { ResponseFormatInterceptor } from './response-format.interceptor';

const dummyContext = {} as ExecutionContext;

const handlerOf = <T>(value: T): CallHandler => ({ handle: () => of(value) });

describe('ResponseFormatInterceptor', () => {
  let interceptor: ResponseFormatInterceptor;

  beforeEach(() => {
    interceptor = new ResponseFormatInterceptor();
  });

  it('단일 객체는 { success, data }로 감싼다', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(dummyContext, handlerOf({ id: '01HX', name: 'Kim' })),
    );

    expect(result).toEqual({
      success: true,
      data: { id: '01HX', name: 'Kim' },
    });
  });

  it('배열은 그대로 data로 감싼다 (meta 없음)', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(dummyContext, handlerOf([{ id: 1 }, { id: 2 }])),
    );

    expect(result).toEqual({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
    });
  });

  it('PaginatedResult는 { success, data, meta }로 펴진다', async () => {
    const paginated: PaginatedResult<{ id: string }> = {
      data: [{ id: 'a' }, { id: 'b' }],
      meta: { nextCursor: 'cur-1', hasNext: true, total: 42 },
    };

    const result = await firstValueFrom(
      interceptor.intercept(dummyContext, handlerOf(paginated)),
    );

    expect(result).toEqual({
      success: true,
      data: [{ id: 'a' }, { id: 'b' }],
      meta: { nextCursor: 'cur-1', hasNext: true, total: 42 },
    });
  });

  it('data/meta 두 키가 있어도 meta에 hasNext가 없으면 단순 객체로 취급', async () => {
    const fakePaginated = {
      data: [{ id: 'a' }],
      meta: { nextCursor: 'x' },
    };

    const result = await firstValueFrom(
      interceptor.intercept(dummyContext, handlerOf(fakePaginated)),
    );

    expect(result).toEqual({
      success: true,
      data: fakePaginated,
    });
  });

  it('null은 그대로 data: null로 감싼다', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(dummyContext, handlerOf(null)),
    );

    expect(result).toEqual({ success: true, data: null });
  });
});
