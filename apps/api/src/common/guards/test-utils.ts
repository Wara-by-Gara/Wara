import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

export interface MockRequestOptions {
  user?: JwtPayload;
  params?: Record<string, string>;
  headers?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

export function createMockRequest(opts: MockRequestOptions = {}): Request {
  return {
    user: opts.user,
    params: opts.params ?? {},
    headers: opts.headers ?? {},
    cookies: opts.cookies ?? {},
  } as unknown as Request;
}

export function createMockExecutionContext(request: Request): ExecutionContext {
  const handler = () => undefined;
  class TestClass {}
  return {
    switchToHttp: () => ({
      getRequest: <T = Request>() => request as T,
      getResponse: <T = unknown>() => ({}) as T,
      getNext: <T = unknown>() => ({}) as T,
    }),
    getHandler: () => handler,
    getClass: <T = unknown>() => TestClass as unknown as new () => T,
    getArgs: <T extends Array<unknown>>() => [] as unknown as T,
    getArgByIndex: <T = unknown>() => undefined as unknown as T,
    getType: <T extends string = string>() => 'http' as T,
    switchToRpc: () => ({}) as ReturnType<ExecutionContext['switchToRpc']>,
    switchToWs: () => ({}) as ReturnType<ExecutionContext['switchToWs']>,
  };
}
