export interface CommunityDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rules: string;
}

const rules = (lines: string[]) => lines.join('\n');

export const CURATED_COMMUNITIES: readonly CommunityDefinition[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'bible-questions',
    name: 'BibleQuestions',
    description: 'Hard questions, Scripture interpretations, and biblical discussions.',
    icon: 'book-outline',
    rules: rules([
      'Ask the question you actually have.',
      'Cite the passage you are discussing when you can.',
      'Disagree with an interpretation, not with a person’s worth.',
      'Do not present your reading as the only one a faithful person could hold.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'adventist-life',
    name: 'AdventistLife',
    description: 'Church life, funny experiences, Adventist culture, and everyday conversations.',
    icon: 'sunny-outline',
    rules: rules([
      'Humor is welcome. Humiliation is not.',
      'Stories about real congregations should not identify private people.',
      'Cultural conversation can be light without becoming careless.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'relationships',
    name: 'Relationships',
    description: 'Christian dating, marriage, friendships, boundaries, and relationships.',
    icon: 'people-outline',
    rules: rules([
      'Do not share someone else’s private story.',
      'Advice should leave room for another person’s conscience.',
      'No matchmaking, no solicitation, and no pressure.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'sabbath-school',
    name: 'SabbathSchool',
    description: 'Weekly Bible lesson conversations and reflections.',
    icon: 'library-outline',
    rules: rules([
      'Stay close to the week’s passage and the questions it raises.',
      'Classrooms differ. Describe your experience without scoring other classes.',
      'Questions are as welcome as conclusions.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'church-and-culture',
    name: 'ChurchAndCulture',
    description: 'Church leadership, practical issues, difficult conversations, and generational perspectives.',
    icon: 'chatbubbles-outline',
    rules: rules([
      'Criticism of practices and decisions is allowed.',
      'Personal attacks, rumors, and unnamed accusations are not.',
      'Do not post private information about leaders or members.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'prophecy',
    name: 'Prophecy',
    description: 'Daniel, Revelation, the sanctuary, and Christian eschatology.',
    icon: 'eye-outline',
    rules: rules([
      'Separate the text, the interpretation, and the speculation.',
      'Do not use prophecy to threaten or rank other people.',
      'Be honest about uncertainty.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'young-adults',
    name: 'YoungAdults',
    description: 'Friendships, faith, careers, transitions, and young adult life.',
    icon: 'compass-outline',
    rules: rules([
      'This is a conversation among adults.',
      'Career and life questions do not need a tidy spiritual ending.',
      'Be specific enough to be useful and careful with other people’s details.',
    ]),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'prayer-requests',
    name: 'PrayerRequests',
    description: 'Prayer, encouragement, and spiritual support.',
    icon: 'heart-outline',
    rules: rules([
      'Share only what you want in public.',
      'Respond with care. Do not interrogate someone who asked for prayer.',
      'Do not post another person’s crisis for them.',
    ]),
  },
];

export function communityLabel(name: string): string {
  return `c/${name}`;
}
