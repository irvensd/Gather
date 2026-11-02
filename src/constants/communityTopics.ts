export const COMMUNITY_TOPICS = [
  { id: 'bible', label: 'Bible and study' },
  { id: 'church', label: 'Church life' },
  { id: 'family', label: 'Family and home' },
  { id: 'support', label: 'Support and prayer' },
  { id: 'everyday', label: 'Everyday life' },
  { id: 'more', label: 'More communities' },
] as const;

export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number]['id'];

const TOPIC_BY_SLUG: Record<string, CommunityTopic> = {
  'bible-questions': 'bible',
  'sabbath-school': 'bible',
  prophecy: 'bible',
  'bible-study-groups': 'bible',
  'teachers-lounge': 'bible',
  'new-believers': 'bible',
  'small-groups': 'bible',
  'adventist-life': 'church',
  'church-and-culture': 'church',
  'ministry-workers': 'church',
  'music-and-worship': 'church',
  'hymns-and-songs': 'church',
  'church-finance': 'church',
  'mission-stories': 'church',
  vespers: 'church',
  'language-and-culture': 'church',
  pathfinders: 'church',
  relationships: 'family',
  parenting: 'family',
  'family-worship': 'family',
  hospitality: 'family',
  'young-adults': 'family',
  'campus-life': 'family',
  'new-city': 'family',
  'prayer-requests': 'support',
  'grief-and-hope': 'support',
  'anxiety-and-faith': 'support',
  'widows-and-friends': 'support',
  'healthful-living': 'everyday',
  'vegetarian-table': 'everyday',
  'creation-care': 'everyday',
  'sabbath-afternoon': 'everyday',
};

export function isCommunityTopic(value: unknown): value is CommunityTopic {
  return COMMUNITY_TOPICS.some((topic) => topic.id === value);
}

/** A topic chosen at creation wins. Older rooms without one land in "More communities". */
export function communityTopic(slug: string, chosen?: string | null): CommunityTopic {
  if (isCommunityTopic(chosen)) return chosen;
  return TOPIC_BY_SLUG[slug] ?? 'more';
}
