import { Logger } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import type postgres from 'postgres';
import { recordQueryTime } from './db-time-store';

const SLOW_QUERY_THRESHOLD_MS = 100;
const log = new Logger('SlowQuery');

type OnQueryComplete = (queryText: string, durationMs: number) => void;

// PendingQuery는 Promise-like + .values()/.cursor() 등 빌더 메소드를 가짐.
// Drizzle은 `client.unsafe(sql, params).values()`처럼 .values()를 호출하므로
// 원본/변형 PendingQuery 양쪽의 .then을 모두 가로채야 onQuery가 호출됨.
function wrapPendingQuery<T>(pending: T, queryText: string, start: number, onQuery: OnQueryComplete): T {
  const p = pending as unknown as {
    then: (onFulfilled?: unknown, onRejected?: unknown) => unknown;
    values?: (...args: unknown[]) => unknown;
    cursor?: (...args: unknown[]) => unknown;
  };
  const originalThen = p.then.bind(pending);
  let reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    onQuery(queryText, performance.now() - start);
  };
  p.then = (onFulfilled?: unknown, onRejected?: unknown) =>
    originalThen(
      (val: unknown) => {
        report();
        return typeof onFulfilled === 'function' ? (onFulfilled as (v: unknown) => unknown)(val) : val;
      },
      (err: unknown) => {
        report();
        if (typeof onRejected === 'function') return (onRejected as (e: unknown) => unknown)(err);
        throw err;
      },
    );
  if (typeof p.values === 'function') {
    const originalValues = p.values.bind(pending);
    p.values = (...args: unknown[]) => wrapPendingQuery(originalValues(...args), queryText, start, onQuery);
  }
  if (typeof p.cursor === 'function') {
    const originalCursor = p.cursor.bind(pending);
    p.cursor = (...args: unknown[]) => originalCursor(...args);
  }
  return pending;
}

function onQuery(queryText: string, ms: number): void {
  recordQueryTime(ms);
  if (ms >= SLOW_QUERY_THRESHOLD_MS) {
    const snippet = queryText.replace(/\s+/g, ' ').slice(0, 200);
    log.warn(`${ms.toFixed(1)}ms ${snippet}`);
  }
}

export function instrumentPostgresClient(client: postgres.Sql): postgres.Sql {
  const originalUnsafe = client.unsafe.bind(client) as (...args: unknown[]) => unknown;
  (client as unknown as { unsafe: unknown }).unsafe = (...args: unknown[]) => {
    const text = typeof args[0] === 'string' ? args[0] : '';
    const start = performance.now();
    const pending = originalUnsafe(...args);
    return wrapPendingQuery(pending, text, start, onQuery);
  };
  return client;
}
