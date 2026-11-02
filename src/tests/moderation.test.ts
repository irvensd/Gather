import { composeModerationReason, MODERATION_REASONS } from '@/constants/moderationReasons';
import { createDemoApi } from '@/lib/backend/demo/store';

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

const PASSWORD = 'gather-demo';

describe('moderation reasons', () => {
  it('offers presets for every action and joins an optional note', () => {
    for (const presets of Object.values(MODERATION_REASONS)) expect(presets.length).toBeGreaterThan(0);
    expect(composeModerationReason('Spam or advertising', '')).toBe('Spam or advertising');
    expect(composeModerationReason('Off topic', '  Try   c/AskGather instead. ')).toBe('Off topic: Try c/AskGather instead.');
    expect(composeModerationReason('Off topic', 'x'.repeat(600)).length).toBe(500);
  });
});

describe('community management in the demo', () => {
  it('lets the starter edit the community and choose moderators', async () => {
    const api = createDemoApi();
    await api.signIn('mira@demo.gather', PASSWORD);
    const created = await api.createCommunity({
      name: 'Garden Club',
      description: 'Growing food and flowers together.',
      rules: '',
      icon: 'leaf-outline',
      topic: 'everyday',
      color: 'green',
    });

    const updated = await api.updateCommunity(created.id, {
      description: 'Growing food, flowers, and friendships.',
      rules: 'Share seeds freely.',
      icon: 'flower-outline',
      color: 'rose',
      topic: 'family',
    });
    expect(updated).toMatchObject({ icon: 'flower-outline', color: 'rose', topic: 'family', rules: 'Share seeds freely.' });
    await expect(
      api.updateCommunity(created.id, { ...updated, description: 'short', icon: 'flower-outline', color: 'rose', topic: 'family' }),
    ).rejects.toThrow();

    const starterOnly = await api.listCommunityModerators(created.id);
    expect(starterOnly).toHaveLength(1);
    expect(starterOnly[0]).toMatchObject({ username: 'mira_lane', isStarter: true });

    await expect(api.addCommunityModerator(created.id, 'priya_santos')).rejects.toThrow('join the community first');
    await expect(api.addCommunityModerator(created.id, 'nobody_here')).rejects.toThrow('No one has that username');
    await api.signOut();

    await api.signIn('priya@demo.gather', PASSWORD);
    await api.setMembership(created.id, true);
    await expect(
      api.updateCommunity(created.id, { description: 'Taking over this place.', rules: '', icon: 'eye-outline', color: 'slate', topic: 'everyday' }),
    ).rejects.toThrow();
    await api.signOut();

    await api.signIn('mira@demo.gather', PASSWORD);
    const priya = await api.addCommunityModerator(created.id, '@Priya_Santos');
    expect(priya).toMatchObject({ username: 'priya_santos', isStarter: false });
    await expect(api.addCommunityModerator(created.id, 'priya_santos')).rejects.toThrow('already a moderator');
    const both = await api.listCommunityModerators(created.id);
    expect(both.map((item) => item.username)).toEqual(['mira_lane', 'priya_santos']);
    await api.signOut();

    await api.signIn('priya@demo.gather', PASSWORD);
    const edited = await api.updateCommunity(created.id, {
      description: 'Growing food, flowers, and friendships.',
      rules: '',
      icon: 'leaf-outline',
      color: 'green',
      topic: 'everyday',
    });
    expect(edited.rules.length).toBeGreaterThan(0);
    const mira = both.find((item) => item.isStarter)!;
    await expect(api.removeCommunityModerator(created.id, mira.userId)).rejects.toThrow('stays a moderator');
    await api.removeCommunityModerator(created.id, priya.userId);
    expect((await api.listCommunityModerators(created.id)).map((item) => item.username)).toEqual(['mira_lane']);
    expect((await api.getCapabilities()).communityIds).not.toContain(created.id);
  });

  it('lets a moderator remove an unreported comment and tells the author why', async () => {
    const api = createDemoApi();
    await api.signIn('rowan@demo.gather', PASSWORD);
    const feed = await api.getFeed({ filter: 'new', offset: 0, limit: 50 });
    const caps = await api.getCapabilities();
    let target: { postId: string; communityId: string; commentId: string; author: string } | null = null;
    for (const post of feed.items) {
      if (!caps.isAdmin && !caps.communityIds.includes(post.communityId)) continue;
      const comment = (await api.getComments(post.id)).find(
        (item) => item.status === 'published' && item.authorUsername && item.authorUsername !== 'rowan_hale',
      );
      if (comment) {
        target = { postId: post.id, communityId: post.communityId, commentId: comment.id, author: comment.authorUsername! };
        break;
      }
    }
    expect(target).not.toBeNull();
    await api.moderate({
      communityId: target!.communityId,
      targetType: 'comment',
      targetId: target!.commentId,
      action: 'remove',
      reason: 'Harassment or insults',
    });
    const after = (await api.getComments(target!.postId)).find((item) => item.id === target!.commentId);
    expect(after?.status).toBe('removed');
    expect(after?.body).toBe('');
    const history = await api.listModerationHistory();
    expect(history[0]).toMatchObject({ action: 'remove', targetType: 'comment', moderatorUsername: 'rowan_hale' });
    await api.signOut();

    const people: Record<string, string> = {
      mira_lane: 'mira@demo.gather',
      elias_cho: 'elias@demo.gather',
      noah_bennett: 'noah@demo.gather',
      priya_santos: 'priya@demo.gather',
      jonah_okonkwo: 'jonah@demo.gather',
    };
    await api.signIn(people[target!.author]!, PASSWORD);
    const inbox = await api.listNotifications();
    expect(inbox.find((item) => item.type === 'content_removed' && item.commentId === target!.commentId)?.snippet).toBe('Harassment or insults');
  });
});
