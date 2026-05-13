export interface PaginatedMeta {
  nextCursor: string | null;
  hasNext: boolean;
  total?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export const isPaginatedResult = (
  value: unknown,
): value is PaginatedResult<unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { data?: unknown; meta?: unknown };
  if (!Array.isArray(candidate.data)) return false;
  if (typeof candidate.meta !== 'object' || candidate.meta === null) return false;
  return 'hasNext' in (candidate.meta as Record<string, unknown>);
};
