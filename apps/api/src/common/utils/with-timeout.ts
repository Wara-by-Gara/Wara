// Promise에 강제 타임아웃을 거는 헬퍼.
// 주 용도: Redis(@keyv/redis)가 연결 실패 시 hang하는 문제 대비 — cache get/set을 wrap.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
