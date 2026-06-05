// PostgreSQL의 단일 INSERT 파라미터 한계(65535)를 우회하기 위한 chunked insert.
// 대용량 seed (수만 행) 시 single statement는 한계에 걸리므로 1000행씩 끊어서 보냄.
export async function chunkedInsert<T>(
  insertFn: (chunk: T[]) => Promise<unknown>,
  values: T[],
  chunkSize = 1000,
): Promise<void> {
  if (values.length === 0) return;
  for (let i = 0; i < values.length; i += chunkSize) {
    await insertFn(values.slice(i, i + chunkSize));
  }
}
