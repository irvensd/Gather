import { LIMITS } from '@/constants/limits';
import { postSchema, type PostValues } from '@/lib/validation/schemas';

export function isPostReady(values: Partial<PostValues>): boolean {
  const title = values.title?.trim() ?? '';
  const body = values.body?.trim() ?? '';
  const communityId = values.communityId ?? '';
  if (!communityId || title.length < LIMITS.titleMin || body.length < 1) return false;
  return postSchema.safeParse({
    communityId,
    type: values.type ?? 'discussion',
    title,
    body,
    scriptureReferences: values.scriptureReferences ?? [],
  }).success;
}
