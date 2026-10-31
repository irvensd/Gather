import { LIMITS } from '@/constants/limits';

export function paginate<T>(items: readonly T[], offset = 0, limit: number = LIMITS.pageSize): { items: T[]; nextOffset: number | null } {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || LIMITS.pageSize, 1), LIMITS.maxPageSize);
  const safeOffset = Math.max(Math.trunc(offset) || 0, 0);
  const slice = items.slice(safeOffset, safeOffset + safeLimit);
  const nextOffset = safeOffset + safeLimit < items.length ? safeOffset + safeLimit : null;
  return { items: slice, nextOffset };
}
