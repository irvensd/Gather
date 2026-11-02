import { CURATED_COMMUNITIES } from '@/constants/communities';
import { extraConversations } from '@/lib/backend/demo/moreSample';
import type { DemoState, DemoUser } from '@/lib/backend/demo/types';
import { crossedMilestone, PRAYER_MILESTONES, VOTE_MILESTONES } from '@/lib/domain/notifications';
import { parseReference } from '@/lib/scripture/parse';
import { WEEKLY_PASSAGES } from '@/lib/weekly';
import type { PostType, ScriptureReference } from '@/types';

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

  const extra = extraConversations(people, ago);
  posts.push(...extra.posts);

  posts.push(
    ...WEEKLY_PASSAGES.map((passage, index) => ({
      id: passage.postId,
      communityId: communityId['sabbath-school']!,
      authorId: people[2]!.id,
      type: 'discussion' as PostType,
      title: passage.title,
      body: `This week's passage is ${passage.reference}. Read it in the World English Bible, then say what you notice. This conversation is not the Sabbath School pamphlet.`,
      scriptureReferences: [ref(passage.reference)],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(14 - index),
      updatedAt: ago(14 - index),
    })),
    {
      id: 'c2000000-0000-4000-8000-000000000016',
      communityId: communityId['prayer-requests']!,
      authorId: people[1]!.id,
      type: 'prayer_request' as PostType,
      title: 'A job interview on Friday',
      body: 'I asked for the afternoon off and I do not know what they will say. Please pray for a clear head, and for me to tell the truth about Sabbath without a speech.',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(9),
      updatedAt: ago(9),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000017',
      communityId: communityId['prayer-requests']!,
      authorId: people[4]!.id,
      type: 'prayer_request' as PostType,
      title: 'My mother goes in for tests this week',
      body: 'I am not ready to explain the diagnosis in public. If you pray, pray for steadiness for her and for the people sitting in the waiting room with her.',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(3),
      updatedAt: ago(3),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000018',
      communityId: communityId['adventist-life']!,
      authorId: people[5]!.id,
      type: 'discussion' as PostType,
      title: 'What did your church call haystacks?',
      body: 'Some of us met them as haystacks. Some of us met a pile of chips and beans with no name at all. I want the stories, not a verdict on whether it counts as cooking.',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(22),
      updatedAt: ago(22),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000019',
      communityId: communityId['adventist-life']!,
      authorId: people[0]!.id,
      type: 'testimony' as PostType,
      title: 'Vespers was the first place I stayed after the sermon',
      body: 'I used to leave when the sermon ended. A small vespers circle asked nothing of me except a chair. Psalm 92:1-2 was the whole program, and it was enough.',
      scriptureReferences: [ref('Psalm 92:1-2')],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(11),
      updatedAt: ago(11),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000020',
      communityId: communityId['bible-questions']!,
      authorId: people[3]!.id,
      type: 'question' as PostType,
      title: 'Is Psalm 23 only for funerals?',
      body: 'Psalm 23:1-4 shows up when someone has died, and then we put it away. Can it also be a psalm for an ordinary Wednesday, or does that thin it out?',
      scriptureReferences: [ref('Psalm 23:1-4')],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(7),
      updatedAt: ago(7),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000021',
      communityId: communityId['young-adults']!,
      authorId: people[3]!.id,
      type: 'discussion' as PostType,
      title: 'Moving to a city where I do not know the church',
      body: 'I start a job next month. I can find a building. I do not know how to find a table where someone will ask my name twice. What did you do the first Sabbath in a new place?',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(5),
      updatedAt: ago(5),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000022',
      communityId: communityId['church-and-culture']!,
      authorId: people[2]!.id,
      type: 'discussion' as PostType,
      title: 'Announcements are swallowing the service',
      body: 'By the time we sing, the room has heard about every committee. I am not against news. I am asking what we think the gathering is for if the calendar comes first.',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(13),
      updatedAt: ago(13),
    },
    {
      id: 'c2000000-0000-4000-8000-000000000023',
      communityId: communityId.relationships!,
      authorId: people[1]!.id,
      type: 'discussion' as PostType,
      title: 'Sabbath when only one of you grew up with it',
      body: 'My partner is willing and also confused. Sunset feels like a rule I brought home from childhood. How do you share a day without turning the other person into a guest in their own house?',
      scriptureReferences: [],
      status: 'published' as const,
      isLocked: false,
      createdAt: ago(1),
      updatedAt: ago(1),
    },
  );

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
    {
      id: 'd3000000-0000-4000-8000-000000000005',
      postId: 'c2000000-0000-4000-8000-000000000011',
      parentCommentId: null,
      authorId: people[0]!.id,
      body: 'The command to rest lands differently when the week has already taken the day. I still want the reason in the verse, not only the schedule.',
      scriptureReferences: [ref('Exodus 20:8-11')],
      status: 'published',
      depth: 0,
      createdAt: ago(6),
      updatedAt: ago(6),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000006',
      postId: 'c2000000-0000-4000-8000-000000000011',
      parentCommentId: 'd3000000-0000-4000-8000-000000000005',
      authorId: people[2]!.id,
      body: 'The reason in Exodus is creation, and then it is also the people who were not allowed to rest. Both are in the neighborhood of this text.',
      scriptureReferences: [],
      status: 'published',
      depth: 1,
      createdAt: ago(4),
      updatedAt: ago(4),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000007',
      postId: 'c2000000-0000-4000-8000-000000000013',
      parentCommentId: null,
      authorId: people[1]!.id,
      body: 'Mark 2:27 is the sentence I wish someone had said to me as a teenager. The day is a gift before it is a fence.',
      scriptureReferences: [ref('Mark 2:27')],
      status: 'published',
      depth: 0,
      createdAt: ago(8),
      updatedAt: ago(8),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000008',
      postId: 'c2000000-0000-4000-8000-000000000018',
      parentCommentId: null,
      authorId: people[3]!.id,
      body: 'We called it haystacks only after I left home. At the table it was just "the chips."',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(12),
      updatedAt: ago(12),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000009',
      postId: 'c2000000-0000-4000-8000-000000000018',
      parentCommentId: 'd3000000-0000-4000-8000-000000000008',
      authorId: people[4]!.id,
      body: 'Same pile, different name, and someone always apologizing for the salsa.',
      scriptureReferences: [],
      status: 'published',
      depth: 1,
      createdAt: ago(10),
      updatedAt: ago(10),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000010',
      postId: 'c2000000-0000-4000-8000-000000000020',
      parentCommentId: null,
      authorId: people[2]!.id,
      body: 'I read Psalm 23:1-4 on Wednesday mornings now. A funeral does not own a pasture.',
      scriptureReferences: [ref('Psalm 23:1-4')],
      status: 'published',
      depth: 0,
      createdAt: ago(3),
      updatedAt: ago(3),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000011',
      postId: 'c2000000-0000-4000-8000-000000000021',
      parentCommentId: null,
      authorId: people[0]!.id,
      body: 'I sat in the back for three weeks and then accepted a lunch invitation I almost declined. The lunch did what the bulletin could not.',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(2),
      updatedAt: ago(2),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000012',
      postId: 'c2000000-0000-4000-8000-000000000008',
      parentCommentId: null,
      authorId: people[5]!.id,
      body: 'Praying, and not asking you to explain the rest.',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(5),
      updatedAt: ago(5),
    },
    {
      id: 'd3000000-0000-4000-8000-000000000013',
      postId: 'c2000000-0000-4000-8000-000000000023',
      parentCommentId: null,
      authorId: people[3]!.id,
      body: 'We started by protecting one meal and a walk, and left the rest of the day negotiable. The walk became the part we both wanted.',
      scriptureReferences: [],
      status: 'published',
      depth: 0,
      createdAt: ago(1),
      updatedAt: ago(1),
    },
    ...extra.comments,
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

  const extras = CURATED_COMMUNITIES.filter((community) => community.id >= 'a1000000-0000-4000-8000-000000000009');
  extras.forEach((community, index) => {
    const count = (index % 4) + 2;
    for (let n = 0; n < count; n += 1) {
      memberships.push({
        userId: people[(index + n) % people.length]!.id,
        communityId: community.id,
        createdAt: ago(90 - index),
      });
    }
  });

  function starterId(communityId: string) {
    const number = Number(communityId.slice(-2));
    if (number < 9 || number % 3 === 0) return null;
    return people[number % 5]!.id;
  }

  const state: DemoState = {
    users,
    sessionUserId: null,
    communities: CURATED_COMMUNITIES.map((community) => {
      const createdByUserId = starterId(community.id);
      return createdByUserId ? { ...community, createdByUserId } : { ...community };
    }),
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
    prayers: [
      { userId: people[0]!.id, postId: 'c2000000-0000-4000-8000-000000000008' },
      { userId: people[1]!.id, postId: 'c2000000-0000-4000-8000-000000000008' },
      { userId: people[2]!.id, postId: 'c2000000-0000-4000-8000-000000000008' },
      { userId: people[4]!.id, postId: 'c2000000-0000-4000-8000-000000000008' },
      { userId: people[5]!.id, postId: 'c2000000-0000-4000-8000-000000000008' },
      { userId: people[0]!.id, postId: 'c2000000-0000-4000-8000-000000000016' },
      { userId: people[2]!.id, postId: 'c2000000-0000-4000-8000-000000000016' },
      { userId: people[3]!.id, postId: 'c2000000-0000-4000-8000-000000000016' },
      { userId: people[0]!.id, postId: 'c2000000-0000-4000-8000-000000000017' },
      { userId: people[1]!.id, postId: 'c2000000-0000-4000-8000-000000000017' },
      { userId: people[3]!.id, postId: 'c2000000-0000-4000-8000-000000000017' },
      { userId: people[5]!.id, postId: 'c2000000-0000-4000-8000-000000000017' },
    ],
    notifications: [],
    reports: [],
    blocks: [],
    moderators: CURATED_COMMUNITIES.flatMap((community) => {
      const createdByUserId = starterId(community.id);
      const rowan = { communityId: community.id, userId: people[5]!.id };
      if (!createdByUserId || createdByUserId === people[5]!.id) return [rowan];
      return [rowan, { communityId: community.id, userId: createdByUserId }];
    }),
    admins: [people[5].id],
    moderationActions: [],
    rateEvents: [],
    preferences: users.map((person) => ({ userId: person.id, replies: true, mentions: true, encouragement: true })),
  };
  state.notifications = sampleNotifications(state);
  return state;
}

function notificationId(index: number) {
  return `e5000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}

/** Builds the sample inbox from the sample conversations, so every demo account has replies, prayers, and milestones. */
function sampleNotifications(state: DemoState): DemoState['notifications'] {
  const now = Date.now();
  const readBefore = now - 2 * 24 * 60 * 60 * 1000;
  const entries: Omit<DemoState['notifications'][number], 'id' | 'isRead'>[] = [];
  for (const comment of state.comments) {
    const post = state.posts.find((item) => item.id === comment.postId);
    const parent = comment.parentCommentId ? state.comments.find((item) => item.id === comment.parentCommentId) : undefined;
    const recipientId = parent ? parent.authorId : post?.authorId;
    if (!post || !recipientId || recipientId === comment.authorId) continue;
    entries.push({
      recipientId,
      actorId: comment.authorId,
      type: parent ? 'comment_reply' : 'post_reply',
      postId: post.id,
      commentId: comment.id,
      createdAt: comment.createdAt,
    });
  }
  for (const post of state.posts) {
    if (!post.authorId) continue;
    const after = new Date(new Date(post.createdAt).getTime() + 3 * 60 * 60 * 1000).toISOString();
    if (post.type === 'prayer_request') {
      const prayed = state.prayers.filter((prayer) => prayer.postId === post.id).length;
      const reached = crossedMilestone(0, prayed, PRAYER_MILESTONES);
      if (reached) entries.push({ recipientId: post.authorId, actorId: null, type: 'prayer_milestone', postId: post.id, commentId: null, createdAt: after, count: reached });
    }
    const thumbs = state.postVotes.filter((vote) => vote.postId === post.id && vote.value === 1).length;
    const reached = crossedMilestone(0, thumbs, VOTE_MILESTONES);
    if (reached) entries.push({ recipientId: post.authorId, actorId: null, type: 'vote_milestone', postId: post.id, commentId: null, createdAt: after, count: reached });
  }
  return entries
    .filter((entry) => new Date(entry.createdAt).getTime() <= now)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((entry, index) => ({ ...entry, id: notificationId(index), isRead: new Date(entry.createdAt).getTime() < readBefore }));
}

function missing<T>(current: readonly T[], key: (item: T) => string, incoming: readonly T[]) {
  const keys = new Set(current.map(key));
  return incoming.filter((item) => !keys.has(key(item)));
}

/** Adds sample posts from a newer seed without erasing conversations already stored on this phone. */
export function absorbSample(saved: DemoState): DemoState {
  const seed = createSeed();
  const posts = saved.posts ?? [];
  const comments = saved.comments ?? [];
  const postVotes = saved.postVotes ?? [];
  const commentVotes = saved.commentVotes ?? [];
  const prayers = saved.prayers ?? [];
  const communities = saved.communities ?? [];
  const memberships = saved.memberships ?? [];
  const moderators = saved.moderators ?? [];
  const notifications = saved.notifications ?? [];
  const notificationKey = (item: DemoState['notifications'][number]) => `${item.recipientId}:${item.type}:${item.commentId ?? item.postId}:${item.count ?? ''}`;
  return {
    ...seed,
    ...saved,
    communities: [...missing(communities, (community) => community.id, seed.communities), ...communities],
    memberships: [...memberships, ...missing(memberships, (membership) => `${membership.userId}:${membership.communityId}`, seed.memberships)],
    moderators: [...moderators, ...missing(moderators, (moderator) => `${moderator.userId}:${moderator.communityId}`, seed.moderators)],
    posts: [...missing(posts, (post) => post.id, seed.posts), ...posts],
    comments: [...comments, ...missing(comments, (comment) => comment.id, seed.comments)],
    postVotes: [...postVotes, ...missing(postVotes, (vote) => `${vote.userId}:${vote.postId}`, seed.postVotes)],
    commentVotes: [...commentVotes, ...missing(commentVotes, (vote) => `${vote.userId}:${vote.commentId}`, seed.commentVotes)],
    prayers: [...prayers, ...missing(prayers, (prayer) => `${prayer.userId}:${prayer.postId}`, seed.prayers)],
    notifications: [...notifications, ...missing(notifications, notificationKey, seed.notifications)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
