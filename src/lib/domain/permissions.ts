import type { ContentStatus, ProfileStatus } from '@/types';

export function canWrite(status: ProfileStatus | null | undefined): boolean {
  return status === 'active';
}

export function canVote(input: {
  profileStatus: ProfileStatus | null | undefined;
  contentStatus: ContentStatus;
  isLocked: boolean;
}): boolean {
  return canWrite(input.profileStatus) && input.contentStatus === 'published' && !input.isLocked;
}

export function canModerate(input: {
  communityId: string;
  moderatorCommunityIds: readonly string[];
  isAdmin: boolean;
}): boolean {
  return input.isAdmin || input.moderatorCommunityIds.includes(input.communityId);
}

export function canEditOwnContent(input: {
  authorId: string | null;
  viewerId: string | null;
  contentStatus: ContentStatus;
  isLocked: boolean;
}): boolean {
  return (
    !!input.viewerId &&
    input.viewerId === input.authorId &&
    input.contentStatus === 'published' &&
    !input.isLocked
  );
}

export type PostVisibility = 'full' | 'removed' | 'hidden';

export function postVisibility(input: {
  status: ContentStatus;
  authorId: string | null;
  viewerId: string | null;
  blocked: boolean;
  canModerate: boolean;
}): PostVisibility {
  if (input.blocked) return 'hidden';
  if (input.status === 'published') return 'full';
  const privileged = input.viewerId != null && (input.viewerId === input.authorId || input.canModerate);
  if (privileged) return 'removed';
  return 'hidden';
}
