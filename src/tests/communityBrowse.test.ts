import { CURATED_COMMUNITIES } from '@/constants/communities';
import { COMMUNITY_COLORS, communityColorFor } from '@/constants/communityColors';
import { communityTopic } from '@/constants/communityTopics';
import { browseCommunities, groupByTopic, membershipNotice, startedByLabel } from '@/lib/communityBrowse';
import { COMMUNITY_ICON_LABELS, COMMUNITY_ICONS } from '@/lib/domain/community';
import type { Community } from '@/types';

function community(patch: Partial<Community> & Pick<Community, 'id' | 'name'>): Community {
  return {
    slug: patch.name.toLowerCase(),
    description: '',
    icon: 'ellipse-outline',
    rules: '',
    memberCount: 0,
    joined: false,
    isActive: true,
    ...patch,
  };
}

describe('browse communities', () => {
  const rooms = [
    community({ id: '1', name: 'BibleQuestions', description: 'Hard questions', memberCount: 4 }),
    community({ id: '2', name: 'PrayerRequests', description: 'Ask for prayer', memberCount: 20, joined: true }),
    community({ id: '3', name: 'Prophecy', description: 'Daniel and Revelation', memberCount: 9 }),
  ];

  it('keeps joined rooms first, then the fullest', () => {
    expect(browseCommunities(rooms, '').map((item) => item.id)).toEqual(['2', '3', '1']);
  });

  it('matches a name, a slash label, or a description', () => {
    expect(browseCommunities(rooms, 'c/bible').map((item) => item.id)).toEqual(['1']);
    expect(browseCommunities(rooms, 'revelation').map((item) => item.id)).toEqual(['3']);
    expect(browseCommunities(rooms, 'haystacks')).toEqual([]);
  });

  it('names a person when someone started the room, and Gather when nobody did', () => {
    expect(startedByLabel(community({ id: '1', name: 'BibleQuestions' }))).toBe('Started by Gather');
    expect(startedByLabel(community({ id: '4', name: 'Potluck', createdByDisplayName: 'Mira Lane' }))).toBe('Started by Mira Lane');
    expect(membershipNotice('BibleQuestions', true)).toBe('Joined c/Bible Questions');
    expect(membershipNotice('BibleQuestions', false)).toBe('Left c/Bible Questions');
    const roomsWithPeople = [
      community({ id: '4', name: 'Potluck', createdByDisplayName: 'Mira Lane', createdByUsername: 'mira_lane' }),
    ];
    expect(browseCommunities(roomsWithPeople, 'mira').map((item) => item.id)).toEqual(['4']);
  });

  it('puts every sample room in a topic and new rooms in More communities', () => {
    expect(CURATED_COMMUNITIES.every((item) => communityTopic(item.slug) !== 'more')).toBe(true);
    const mixed = [
      community({ id: '1', name: 'BibleQuestions', slug: 'bible-questions' }),
      community({ id: '2', name: 'PrayerRequests', slug: 'prayer-requests' }),
      community({ id: '3', name: 'Potluck Friends', slug: 'potluck-friends' }),
    ];
    expect(groupByTopic(mixed).map((section) => section.title)).toEqual(['Bible and study', 'Support and prayer', 'More communities']);
    expect(groupByTopic(mixed, 'support').map((section) => section.data.map((item) => item.id))).toEqual([['2']]);
    const chosen = [community({ id: '5', name: 'Potluck Friends', slug: 'potluck-friends', topic: 'family' })];
    expect(groupByTopic(chosen).map((section) => section.topic)).toEqual(['family']);
  });
});

describe('community colors and icons', () => {
  it('keeps a chosen color and gives older rooms a stable valid one', () => {
    const ids: string[] = COMMUNITY_COLORS.map((color) => color.id);
    expect(communityColorFor('a1000000-0000-4000-8000-000000000001', 'rose')).toBe('rose');
    const fallback = communityColorFor('a1000000-0000-4000-8000-000000000001', 'neon');
    expect(ids).toContain(fallback);
    expect(communityColorFor('a1000000-0000-4000-8000-000000000001')).toBe(fallback);
  });

  it('labels every icon and still accepts the original ten', () => {
    expect(COMMUNITY_ICONS.length).toBeGreaterThanOrEqual(30);
    for (const icon of COMMUNITY_ICONS) expect(COMMUNITY_ICON_LABELS[icon]).toBeTruthy();
    for (const original of ['book-outline', 'sunny-outline', 'people-outline', 'library-outline', 'chatbubbles-outline', 'eye-outline', 'compass-outline', 'heart-outline', 'leaf-outline', 'cafe-outline']) {
      expect(COMMUNITY_ICONS as readonly string[]).toContain(original);
    }
  });
});
