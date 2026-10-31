import { CURATED_COMMUNITIES } from '@/constants/communities';
import { parseReference } from '@/lib/scripture/parse';
import type { PostType, ScriptureReference } from '@/types';

import type { DemoState, DemoUser } from '@/lib/backend/demo/types';

const DEMO_SALT = 'gather-demo-v1';
const DEMO_PASSWORD_HASH = 'f499d68949f73795091e0c82a0c3513bec2037152ff29bbc2cbde035da4a3089';

function ref(input: string): ScriptureReference {
  const parsed = parseReference(input);
  if (!parsed) throw new Error(`Invalid seed reference: ${input}`);
  return parsed;
}

function ago(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const people: { id: string; email: string; username: string; displayName: string; bio: string; joinedHours: number }[] = [
  { id: 'b1000000-0000-4000-8000-000000000001', email: 'mira@demo.gather', username: 'mira_lane', displayName: 'Mira Lane', bio: 'Reading slowly and asking the questions I used to skip.', joinedHours: 800 },
  { id: 'b1000000-0000-4000-8000-000000000002', email: 'elias@demo.gather', username: 'elias_cho', displayName: 'Elias Cho', bio: 'Sabbath afternoon walks and too many books.', joinedHours: 700 },
  { id: 'b1000000-0000-4000-8000-000000000003', email: 'noah@demo.gather', username: 'noah_bennett', displayName: 'Noah Bennett', bio: 'Teaching Sabbath School and learning as I go.', joinedHours: 640 },
  { id: 'b1000000-0000-4000-8000-000000000004', email: 'priya@demo.gather', username: 'priya_santos', displayName: 'Priya Santos', bio: 'Figuring out friendship, work, and faith in the same week.', joinedHours: 500 },
  { id: 'b1000000-0000-4000-8000-000000000005', email: 'jonah@demo.gather', username: 'jonah_okonkwo', displayName: 'Jonah Okonkwo', bio: 'Interested in Daniel, ordinary church life, and honest critique.', joinedHours: 420 },
  { id: 'b1000000-0000-4000-8000-000000000006', email: 'rowan@demo.gather', username: 'rowan_hale', displayName: 'Rowan Hale', bio: 'Community moderator for this sample space.', joinedHours: 900 },
];

function user(person: (typeof people)[number]): DemoUser {
  return {
    id: person.id,
    email: person.email,
    salt: DEMO_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    username: person.username,
    displayName: person.displayName,
    bio: person.bio,
    avatarPath: null,
    status: 'active',
    onboardingStep: 'done',
    createdAt: ago(person.joinedHours),
  };
}

export function createSeed(): DemoState {
  const users = people.map(user);
  const communityId = Object.fromEntries(CURATED_COMMUNITIES.map((community) => [community.slug, community.id]));
  const posts: DemoState['posts'] = [
    {
      id: 'c2000000-0000-4000-8000-000000000001',
      communityId: communityId['bible-questions'],
      authorId: people[0].id,
      type: 'question' as PostType,
      title: 'Why does God allow suffering?',
      body: 'I keep coming back to John 11:35. Jesus weeps, and the story does not pretend the grief is imaginary. Romans 8:18-25 talks about the whole creation groaning. How do you sit with that without turning it into a slogan?',
      scriptureReferences: [ref('John 11:35'), ref('Romans 8:18-25')],
      status: 'published',
      isLocked: false,
      createdAt: ago(30),
      updatedAt: ago(30),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000002',
      communityId: communityId['adventist-life'],
      authorId: people[1].id,
      type: 'discussion',
      title: 'The potluck table is a culture of its own',
      body: 'Someone brought a dish that was mostly haystacks and optimism. I am not asking for a recipe thread. I am asking when a church meal starts to feel like the actual point of staying.',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(26),
      updatedAt: ago(26),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000003',
      communityId: communityId.relationships,
      authorId: people[3].id,
      type: 'discussion',
      title: 'How do you stay friends when your faith changes at different speeds?',
      body: 'A close friend is asking questions I answered too quickly five years ago. I do not want to manage her faith. I also do not want to disappear. What has actually helped a friendship like that?',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(20),
      updatedAt: ago(20),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000004',
      communityId: communityId['sabbath-school'],
      authorId: people[2].id,
      type: 'discussion',
      title: 'Our class finally sat with the hard verse instead of skipping it',
      body: 'We usually rush the discussion questions. This week we stayed on one paragraph and people disagreed without performing. It felt like Sabbath School rather than a quiz.',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(16),
      updatedAt: ago(16),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000005',
      communityId: communityId['church-and-culture'],
      authorId: people[4].id,
      type: 'discussion',
      title: 'Should churches do more to support young adults?',
      body: 'I am not looking for another Saturday-night social. I mean rent, loneliness, and a place to ask questions without being treated as a project. What would support look like if it were practical?',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(12),
      updatedAt: ago(12),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000006',
      communityId: communityId.prophecy,
      authorId: people[0].id,
      type: 'question',
      title: 'What is Daniel 7:9-14 doing in the middle of the animal visions?',
      body: 'The court scene changes the tone. Daniel 7:9-14 is not another beast. How do you read the Son of Man here without flattening it into a chart?',
      scriptureReferences: [ref('Daniel 7:9-14')],
      status: 'published',
      isLocked: false,
      createdAt: ago(10),
      updatedAt: ago(10),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000007',
      communityId: communityId['young-adults'],
      authorId: people[1].id,
      type: 'discussion',
      title: 'Taking a job that makes Sabbath awkward',
      body: 'The work is good and the schedule is not. I can ask for Fridays, and I might not get them. I would rather hear what people actually did than a theory of faithfulness.',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(8),
      updatedAt: ago(8),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000008',
      communityId: communityId['prayer-requests'],
      authorId: people[3].id,
      type: 'prayer_request',
      title: 'Please pray for my family',
      body: 'We are in a hard season with health and work. I do not want to post details. If you pray, that is enough.',
      scriptureReferences: [],
      status: 'published',
      isLocked: false,
      createdAt: ago(6),
      updatedAt: ago(6),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000009',
      communityId: communityId['bible-questions'],
      authorId: people[2].id,
      type: 'testimony',
      title: 'How my faith changed during a difficult year',
      body: 'I did not become certain. I became more honest. John 14:1-3 used to sound like a timetable to me. Lately it sounds like someone refusing to leave a frightened room without a word.',
      scriptureReferences: [ref('John 14:1-3')],
      status: 'published',
      isLocked: false,
      createdAt: ago(4),
      updatedAt: ago(4),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000010',
      communityId: communityId.prophecy,
      authorId: people[4].id,
      type: 'question',
      title: 'How do you read 1 Thessalonians 4:16-17 next to Revelation 14?',
      body: '1 Thessalonians 4:16-17 and Revelation 14:6-12 get quoted in the same conversations and then talked past each other. I want the texts, not a winning speech.',
      scriptureReferences: [ref('1 Thessalonians 4:16-17'), ref('Revelation 14:6-12')],
      status: 'published',
      isLocked: false,
      createdAt: ago(2),
      updatedAt: ago(2),
    },
  ];

  const comments: DemoState['comments'] = [
    {
      id: 'd3000000-0000-4000-8000-000000000001',
      postId: posts[0].id,
      parentCommentId: null,
      authorId: people[4].id,
      body: 'The weeping matters to me because it happens before the explanation. I do not think Romans 8 cancels John 11.',
      scriptureReferences: [ref('John 11:35')],
      status: 'published',
      depth: 0,
      createdAt: ago(18),
      updatedAt: ago(18),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000002',
      postId: posts[0].id,
      parentCommentId: 'd3000000-0000-4000-8000-000000000001',
      authorId: people[0].id,
      body: 'That order is what I cannot unsee. Thanks for saying it plainly, @jonah_okonkwo.',
      scriptureReferences: [],
      status: 'published',
      depth: 1,
      createdAt: ago(15),
      updatedAt: ago(15),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000003',
      postId: posts[4].id,
      parentCommentId: null,
      authorId: people[3].id,
      body: 'A ride home after the evening service did more for me than a program with my age group in the title.',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(9),
      updatedAt: ago(9),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000004',
      postId: posts[2].id,
      parentCommentId: null,
      authorId: people[1].id,
      body: 'I started asking what she was actually afraid of losing, instead of answering the theological sentence.',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(7),
      updatedAt: ago(7),
    },
  ];

  const memberships = [
    [0, 'bible-questions'],
    [0, 'prophecy'],
    [1, 'adventist-life'],
    [1, 'young-adults'],
    [2, 'sabbath-school'],
    [2, 'bible-questions'],
    [3, 'relationships'],
    [3, 'prayer-requests'],
    [4, 'church-and-culture'],
    [4, 'prophecy'],
    [5, 'bible-questions'],
    [5, 'church-and-culture'],
  ].map(([personIndex, slug]) => ({
    userId: people[personIndex as number].id,
    communityId: communityId[slug as string],
    createdAt: ago(100),
  }));

  return {
    users,
    sessionUserId: null,
    communities: CURATED_COMMUNITIES.map((community) => ({ ...community })),
    memberships,
    posts,
    comments,
    postVotes: [
      { userId: people[4].id, postId: posts[0].id, value: 1 },
      { userId: people[2].id, postId: posts[0].id, value: 1 },
      { userId: people[1].id, postId: posts[4].id, value: 1 },
      { userId: people[0].id, postId: posts[5].id, value: 1 },
    ],
    commentVotes: [{ userId: people[0].id, commentId: comments[0].id, value: 1 }],
    saves: [],
    notifications: [
      {
        id: 'e4000000-0000-4000-8000-000000000001',
        recipientId: people[0].id,
        actorId: people[4].id,
        type: 'post_reply',
        postId: posts[0].id,
        commentId: comments[0].id,
        isRead: false,
        createdAt: ago(18),
      },
      {
        id: 'e4000000-0000-4000-8000-000000000002',
        recipientId: people[4].id,
        actorId: people[0].id,
        type: 'mention',
        postId: posts[0].id,
        commentId: comments[1].id,
        isRead: false,
        createdAt: ago(15),
      },
    ],
    reports: [],
    blocks: [],
    moderators: CURATED_COMMUNITIES.map((community) => ({ communityId: community.id, userId: people[5].id })),
    admins: [people[5].id],
    moderationActions: [],
    rateEvents: [],
    preferences: users.map((person) => ({ userId: person.id, replies: true, mentions: true })),
  };
}
