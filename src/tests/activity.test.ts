import { createSeed } from '@/lib/backend/demo/seed';
import { createDemoApi } from '@/lib/backend/demo/store';
import { allowsNotification, crossedMilestone, formatNotification, groupNotifications, VOTE_MILESTONES } from '@/lib/domain/notifications';
import type { AppNotification } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
type MockNodeCrypto = {
  randomUUID(): string;
  createHash(algorithm: string): { update(value: string): { digest(encoding: string): string } };
};

jest.mock('expo-crypto', () => {
  const node = jest.requireActual<MockNodeCrypto>('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: () => node.randomUUID(),
    digestStringAsync: async (_algorithm: string, value: string) => node.createHash('sha256').update(value).digest('hex'),
  };
});

function note(patch: Partial<AppNotification> & Pick<AppNotification, 'id' | 'createdAt'>): AppNotification {
  return {
    type: 'post_reply',
    actorId: null,
    actorUsername: null,
    actorDisplayName: null,
    postId: 'post-1',
    postType: 'question',
    commentId: null,
    isRead: false,
    ...patch,
  };
}

describe('activity rules', () => {
  it('fires a milestone only when the count crosses it', () => {
    expect(crossedMilestone(4, 5, VOTE_MILESTONES)).toBe(5);
    expect(crossedMilestone(5, 6, VOTE_MILESTONES)).toBeNull();
    expect(crossedMilestone(8, 26, VOTE_MILESTONES)).toBe(25);
    expect(crossedMilestone(5, 4, VOTE_MILESTONES)).toBeNull();
  });

  it('describes the new kinds plainly', () => {
    expect(formatNotification({ type: 'prayer_milestone', actorUsername: null, postType: 'prayer_request', count: 1 })).toBe('Someone prayed for your prayer request.');
    expect(formatNotification({ type: 'prayer_milestone', actorUsername: null, postType: 'prayer_request', count: 5 })).toBe('5 people prayed for your prayer request.');
    expect(formatNotification({ type: 'vote_milestone', actorUsername: null, postType: 'question', count: 10 })).toBe('Your question reached 10 thumbs up.');
    expect(formatNotification({ type: 'content_removed', actorUsername: null, postType: 'question', aboutComment: true })).toBe('A moderator removed your comment.');
    expect(formatNotification({ type: 'post_reply', actorUsername: 'mira', postType: 'testimony', otherActors: 2 })).toBe('@mira and 2 others replied to your testimony.');
  });

  it('lets people mute encouragement but never moderator notices', () => {
    const quiet = { replies: false, mentions: false, encouragement: false };
    expect(allowsNotification('prayer_milestone', quiet)).toBe(false);
    expect(allowsNotification('vote_milestone', quiet)).toBe(false);
    expect(allowsNotification('content_removed', quiet)).toBe(true);
    expect(allowsNotification('new_report', quiet)).toBe(true);
  });

  it('groups by day and folds replies to the same post', () => {
    const now = new Date('2026-11-02T18:00:00');
    const sections = groupNotifications(
      [
        note({ id: 'a', actorId: 'u1', actorUsername: 'first', createdAt: '2026-11-02T17:00:00' }),
        note({ id: 'b', actorId: 'u2', createdAt: '2026-11-02T16:00:00' }),
        note({ id: 'c', actorId: 'u1', createdAt: '2026-11-02T15:00:00', isRead: true }),
        note({ id: 'd', type: 'mention', actorId: 'u3', createdAt: '2026-11-02T14:00:00' }),
        note({ id: 'e', actorId: 'u4', createdAt: '2026-10-30T10:00:00' }),
        note({ id: 'f', actorId: 'u4', createdAt: '2026-09-01T10:00:00' }),
      ],
      now,
    );
    expect(sections.map((section) => section.title)).toEqual(['Today', 'This week', 'Earlier']);
    const [replies, mention] = sections[0]!.data;
    expect(replies!.ids).toEqual(['a', 'b', 'c']);
    expect(replies!.otherActors).toBe(1);
    expect(replies!.isRead).toBe(false);
    expect(replies!.lead.actorUsername).toBe('first');
    expect(mention!.ids).toEqual(['d']);
  });
});

describe('activity in the demo', () => {
  it('starts each sample account with replies, milestones, and unique ids', () => {
    const seed = createSeed();
    const mira = seed.users.find((person) => person.username === 'mira_lane')!;
    const inbox = seed.notifications.filter((item) => item.recipientId === mira.id);
    expect(inbox.length).toBeGreaterThan(3);
    expect(inbox.some((item) => !item.isRead)).toBe(true);
    expect(seed.notifications.some((item) => item.type === 'vote_milestone' || item.type === 'prayer_milestone')).toBe(true);
    expect(new Set(seed.notifications.map((item) => item.id)).size).toBe(seed.notifications.length);
  });

  it('tells moderators about reports, and authors about removals and thumbs up', async () => {
    const api = createDemoApi();
    await api.signIn('mira@demo.gather', 'gather-demo');
    const feed = await api.getFeed({ filter: 'new', offset: 0, limit: 50 });
    const target = feed.items.find((post) => post.authorUsername !== 'mira_lane' && post.authorUsername !== 'rowan_hale');
    expect(target).toBeDefined();
    await api.report({ targetType: 'post', targetId: target!.id, reason: 'spam_or_scam' });
    await api.signOut();

    await api.signIn('rowan@demo.gather', 'gather-demo');
    const rowanInbox = await api.listNotifications();
    const report = rowanInbox.find((item) => item.type === 'new_report' && item.postId === target!.id);
    expect(report?.snippet).toBe('Spam or scam');
    expect(report?.communityName).toBe(target!.communityName);
    await api.moderate({ communityId: target!.communityId, targetType: 'post', targetId: target!.id, action: 'remove', reason: 'Selling something unrelated.' });
    await api.signOut();

    const author = target!.authorUsername;
    const people: Record<string, string> = {
      elias_cho: 'elias@demo.gather',
      noah_bennett: 'noah@demo.gather',
      priya_santos: 'priya@demo.gather',
      jonah_okonkwo: 'jonah@demo.gather',
    };
    await api.signIn(people[author!]!, 'gather-demo');
    const authorInbox = await api.listNotifications();
    const removed = authorInbox.find((item) => item.type === 'content_removed' && item.postId === target!.id);
    expect(removed?.snippet).toBe('Selling something unrelated.');
    expect(removed?.postAvailable).toBe(false);
  });
});
