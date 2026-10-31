import { LIMITS } from '@/constants/limits';
import { buildCommentForest, flattenForDisplay, wouldExceedDepth } from '@/lib/domain/comments';
import { hotScore, sortFeed } from '@/lib/domain/feed';
import { allowsNotification, commentNotificationIntents, extractMentions, formatNotification } from '@/lib/domain/notifications';
import { paginate } from '@/lib/domain/pagination';
import { canModerate, canVote, postVisibility } from '@/lib/domain/permissions';
import { isRateLimited } from '@/lib/domain/rateLimit';
import { communitySlug, validateCommunityName } from '@/lib/domain/community';
import { validateUsername } from '@/lib/domain/username';
import { applyVoteToScore, nextVote } from '@/lib/domain/votes';
import { postSchema } from '@/lib/validation/schemas';
import type { Comment } from '@/types';

describe('votes', () => {
  it('toggles a vote off and switches direction', () => {
    expect(nextVote(0, 1)).toBe(1);
    expect(nextVote(1, 1)).toBe(0);
    expect(nextVote(1, -1)).toBe(-1);
    expect(nextVote(-1, -1)).toBe(0);
    expect(applyVoteToScore(3, 1, -1)).toBe(1);
  });
});

describe('communities', () => {
  it('turns a name into a slug and rejects reserved or empty names', () => {
    expect(communitySlug('Young Adults')).toBe('young-adults');
    expect(validateCommunityName('Young Adults')).toBeNull();
    expect(validateCommunityName('gather')).toBeTruthy();
    expect(validateCommunityName('A')).toBeTruthy();
  });
});

describe('usernames', () => {
  it('accepts a public handle and rejects reserved or malformed names', () => {
    expect(validateUsername('mira_lane')).toBeNull();
    expect(validateUsername('ab')).toBeTruthy();
    expect(validateUsername('1mira')).toBeTruthy();
    expect(validateUsername('admin')).toBeTruthy();
  });
});

describe('feed sorting', () => {
  const now = Date.parse('2026-10-31T12:00:00Z');
  const posts = [
    { id: 'old-popular', score: 5, createdAt: '2026-10-01T12:00:00Z' },
    { id: 'new-quiet', score: 0, createdAt: '2026-10-31T11:00:00Z' },
  ];

  it('keeps a new post visible in popular order', () => {
    const sorted = sortFeed(posts, 'popular', now);
    expect(sorted.map((post) => post.id)).toContain('new-quiet');
    expect(hotScore(0, posts[1].createdAt, now)).toBeGreaterThan(0);
  });

  it('orders the new feed by time', () => {
    expect(sortFeed(posts, 'new', now).map((post) => post.id)).toEqual(['new-quiet', 'old-popular']);
  });
});

describe('comments', () => {
  const comments: Comment[] = [
    comment('root', null, 0),
    comment('child', 'root', 1),
    comment('deep', 'child', 2),
    comment('deeper', 'deep', 3),
    comment('gone', null, 0, 'deleted'),
  ];

  it('nests replies and stops indenting after the display depth', () => {
    const flat = flattenForDisplay(buildCommentForest(comments));
    expect(flat.find((row) => row.comment.id === 'deep')?.hiddenReplyCount).toBe(1);
    expect(flat.some((row) => row.comment.id === 'deeper')).toBe(false);
    expect(flat.some((row) => row.comment.id === 'gone')).toBe(false);
  });

  it('rejects another level past the server maximum', () => {
    expect(wouldExceedDepth(LIMITS.maxCommentDepth)).toBe(true);
    expect(wouldExceedDepth(LIMITS.maxCommentDepth - 1)).toBe(false);
  });
});

describe('notifications', () => {
  it('does not notify the actor and formats a question reply', () => {
    const intents = commentNotificationIntents({
      actorId: 'me',
      postAuthorId: 'author',
      parentAuthorId: null,
      mentionedUserIds: ['author', 'me', 'friend'],
    });
    expect(intents).toEqual([
      { recipientId: 'author', type: 'post_reply' },
      { recipientId: 'author', type: 'mention' },
      { recipientId: 'friend', type: 'mention' },
    ]);
    expect(formatNotification({ type: 'post_reply', actorUsername: 'jonah_okonkwo', postType: 'question' })).toBe(
      '@jonah_okonkwo replied to your question.',
    );
    expect(allowsNotification('mention', { replies: true, mentions: false })).toBe(false);
    expect(extractMentions('thanks @jonah_okonkwo')).toEqual(['jonah_okonkwo']);
  });
});

describe('pagination and permissions', () => {
  it('returns the next offset only when more rows exist', () => {
    expect(paginate([1, 2, 3, 4], 0, 2)).toEqual({ items: [1, 2], nextOffset: 2 });
    expect(paginate([1, 2], 2, 2).nextOffset).toBeNull();
  });

  it('blocks votes on locked posts and hides removed posts from strangers', () => {
    expect(canVote({ profileStatus: 'active', contentStatus: 'published', isLocked: true })).toBe(false);
    expect(canModerate({ communityId: 'c', moderatorCommunityIds: ['c'], isAdmin: false })).toBe(true);
    expect(postVisibility({ status: 'removed', authorId: 'a', viewerId: 'b', blocked: false, canModerate: false })).toBe('hidden');
    expect(isRateLimited([{ action: 'post', createdAt: new Date().toISOString() }], 'post', 1, 60_000)).toBe(true);
  });

  it('requires a title and body', () => {
    expect(postSchema.safeParse({ communityId: 'a1000000-0000-4000-8000-000000000001', type: 'question', title: 'No', body: '', scriptureReferences: [] }).success).toBe(false);
  });
});

function comment(id: string, parent: string | null, depth: number, status: Comment['status'] = 'published'): Comment {
  return {
    id,
    postId: 'post',
    parentCommentId: parent,
    authorId: 'user',
    authorUsername: 'user',
    authorDisplayName: null,
    authorAvatarPath: null,
    body: status === 'published' ? 'Hello' : '',
    scriptureReferences: [],
    status,
    concealed: false,
    depth,
    score: 0,
    userVote: 0,
    createdAt: `2026-10-31T12:00:0${depth}Z`,
  };
}
