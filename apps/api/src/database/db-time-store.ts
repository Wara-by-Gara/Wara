import { AsyncLocalStorage } from 'node:async_hooks';

export type DbTimeContext = { totalMs: number; queryCount: number };

export const dbTimeStore = new AsyncLocalStorage<DbTimeContext>();

export function recordQueryTime(ms: number): void {
  const ctx = dbTimeStore.getStore();
  if (!ctx) return;
  ctx.totalMs += ms;
  ctx.queryCount += 1;
}
