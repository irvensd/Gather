import { EXTRA_COMMUNITIES } from '@/constants/moreCommunities';
import type { DemoComment, DemoPost } from '@/lib/backend/demo/types';
import type { PostType } from '@/types';

function postId(n: number) {
  return `c2000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function commentId(n: number) {
  return `d3000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

type Person = { id: string };

interface ThreadLine {
  author: number;
  body: string;
  /** Index into this thread. Omitted on the first note of a branch. */
  replyTo?: number;
}

function thread(
  people: readonly Person[],
  ago: (hours: number) => string,
  post: string,
  lines: ThreadLine[],
  startId: number,
  hoursAgo: number,
): DemoComment[] {
  return lines.map((line, index) => {
    const parent = line.replyTo === undefined ? null : commentId(startId + line.replyTo);
    const depth = line.replyTo === undefined ? 0 : (lines[line.replyTo]?.replyTo === undefined ? 1 : 2);
    return {
      id: commentId(startId + index),
      postId: post,
      parentCommentId: parent,
      authorId: people[line.author]!.id,
      body: line.body,
      scriptureReferences: [],
      status: 'published',
      depth,
      createdAt: ago(hoursAgo - index),
      updatedAt: ago(hoursAgo - index),
    };
  });
}

function note(
  people: readonly Person[],
  ago: (hours: number) => string,
  n: number,
  slug: string,
  author: number,
  type: PostType,
  title: string,
  body: string,
  hoursAgo: number,
): DemoPost {
  const community = EXTRA_COMMUNITIES.find((item) => item.slug === slug);
  if (!community) throw new Error(`Missing sample community ${slug}`);
  return {
    id: postId(n),
    communityId: community.id,
    authorId: people[author]!.id,
    type,
    title,
    body,
    scriptureReferences: [],
    status: 'published',
    isLocked: false,
    createdAt: ago(hoursAgo),
    updatedAt: ago(hoursAgo),
  };
}

/** Posts and replies for the extra sample communities. */
export function extraConversations(people: readonly Person[], ago: (hours: number) => string): { posts: DemoPost[]; comments: DemoComment[] } {
  const posts: DemoPost[] = [
    note(people, ago, 24, 'pathfinders', 2, 'question', 'What do you do when the child wants to go home and the parent wants the honor?', 'The honor is almost finished. The child is done. I do not want to embarrass either of them in the fellowship hall.', 40),
    note(people, ago, 25, 'parenting', 3, 'discussion', 'Friday night, and a game that starts at sunset', 'We have said yes to the team all season. Friday is the one night I do not want to negotiate in the car. How have you said it without making Sabbath the punishment?', 36),
    note(people, ago, 26, 'grief-and-hope', 1, 'discussion', 'The second month was quieter than the funeral', 'People were kind for two weeks. Then the calendar filled back up and I was still setting one less plate. I do not need a speech. I would like to know what the second month was like for you.', 33),
    note(people, ago, 27, 'vegetarian-table', 0, 'discussion', 'The dish that survives a move', 'I have made the same lentil pot in three kitchens. It is not impressive. It is the one guests finish. What is the dish you trust when you do not trust the oven yet?', 28),
    note(people, ago, 28, 'music-and-worship', 4, 'question', 'Which hymn do you leave alone, even when the service is long?', 'I can lose a chorus. I cannot lose the third verse of a hymn my grandmother sang without the book. Is that stubborn, or is that the point?', 24),
    note(people, ago, 29, 'new-believers', 0, 'question', 'What should I ask before I visit a church the first time?', 'I know the Sabbath hours. I do not know the rest: where to sit, whether to take the bulletin, what the potluck expects of a stranger.', 22),
    note(people, ago, 30, 'campus-life', 3, 'discussion', 'A Friday class I cannot move', 'The lab is graded on attendance. Missing it means retaking the course. I told the professor the truth and I am waiting. Has anyone kept both the class and the Sabbath without a performance?', 20),
    note(people, ago, 31, 'healthful-living', 1, 'discussion', 'A walk that is not a program', 'I do not want a challenge with a chart. I want the walk I take because the afternoon is long and my body asked for it. Where do you go when you are not trying to improve?', 18),
    note(people, ago, 32, 'small-groups', 2, 'discussion', 'We stopped using the study guide and the room got honest', 'Someone asked a question the booklet did not have a box for. We stayed there. Three people talked who usually read the answer. I am afraid to do it again in case it was an accident.', 16),
    note(people, ago, 33, 'ministry-workers', 5, 'discussion', 'The board meeting that should have been a phone call', 'Forty minutes on the color of the chairs. The family who needed a ride home was not on the agenda. I am trying to say that without humiliating the people who care about the chairs.', 15),
    note(people, ago, 34, 'sabbath-afternoon', 4, 'discussion', 'The nap is the plan', 'I used to fill the afternoon so no one would think I was wasting it. This week I slept, then walked to the end of the block. It felt like obedience and also like nothing. Both can be true.', 13),
    note(people, ago, 35, 'mission-stories', 4, 'testimony', 'The story I tell is neater than the year was', 'I talk about the school and skip the month I wanted to fly home. The neat version gets invited back. The true one is harder to offer at a fellowship lunch.', 11),
    note(people, ago, 36, 'creation-care', 1, 'discussion', 'The garden we ignore from May to August', 'We plant in a burst and then the weeds tell the truth about our summer. Sabbath is the one day I will pull them without calling it a project. Is that cheating, or is that the day doing its work?', 10),
    note(people, ago, 37, 'church-finance', 5, 'question', 'How do you ask where the offering went without starting a fight?', 'I give. I also want a sentence in ordinary language. The report is three pages and I still do not know what the roof cost. What question has actually gotten an answer?', 8),
    note(people, ago, 38, 'anxiety-and-faith', 3, 'prayer_request', 'Church makes my chest tight and I still want to be there', 'I sit near the door. I leave during the last song if I need to. Please do not tell me to pray harder. A quiet prayer is enough.', 7),
    note(people, ago, 39, 'new-city', 0, 'discussion', 'Three churches in, and I still sit in the back', 'Each one has been kind. None of them has been mine yet. I am trying to tell the difference between slow and wrong.', 6),
    note(people, ago, 40, 'family-worship', 2, 'discussion', 'Ten minutes, and then someone has to find their shoes', 'We read a short psalm and we are done. The shoes are the real liturgy. I would rather keep the ten minutes than build a program we abandon by Thursday.', 5),
    note(people, ago, 41, 'hospitality', 1, 'discussion', 'The extra plate, and the Tuesday I needed the house empty', 'I like being the house people come to. Last week I said not this week, and I felt both rude and honest. How do you keep an open door without living in the hallway?', 4),
    note(people, ago, 42, 'hymns-and-songs', 4, 'discussion', 'We dropped a verse and I missed it all month', 'It was the verse about the morning. The chorus was fine. I am not asking the church to perform my memory. I am asking whether anyone else notices when a verse disappears.', 3),
    note(people, ago, 43, 'vespers', 2, 'discussion', 'Friday night was a lamp and four people', 'No slideshow. Someone read, someone sang one verse, and we went home. I have been in programs that tried harder and fed me less.', 2),
  ];

  const comments: DemoComment[] = [
    ...thread(people, ago, postId(24), [
      { author: 3, body: 'I asked the child, in the hall and not on the platform, whether leaving would feel like quitting or like relief.' },
      { author: 2, replyTo: 0, body: 'Relief. We left after the next song and the parent was angry in the car, then quiet by the driveway.' },
      { author: 3, replyTo: 1, body: 'The driveway quiet is the part I would trust. The hall is a bad place to settle a family.' },
      { author: 4, body: 'We let the honor go unfinished once. The child still talks about that night as the night we chose them. The patch can be earned later.' },
      { author: 0, replyTo: 3, body: 'That is the sentence I needed. Later is allowed.' },
    ], 14, 38),
    ...thread(people, ago, postId(25), [
      { author: 1, body: 'We told the coach in August, not on the Friday of the game. August gave everyone a calendar instead of a crisis.' },
      { author: 3, replyTo: 0, body: 'August is already gone for us. I am looking for the sentence that works in the car tonight.' },
      { author: 1, replyTo: 1, body: 'Then I would say: we are going home at sunset, and I will come back for you when the game ends. Presence without pretending the clock moved.' },
      { author: 0, body: 'We lost a season doing it the other way, smiling and resenting it. The resentment was louder than the game.' },
      { author: 2, replyTo: 3, body: 'The resentment is what the kids remember. Not the score.' },
    ], 19, 34),
    ...thread(people, ago, postId(26), [
      { author: 0, body: 'The second month was groceries. I stood in the aisle and could not remember if we still bought the tea. A friend texted on a Tuesday and did not ask how I was.' },
      { author: 1, replyTo: 0, body: 'The Tuesday text is the one I still have. The funeral flowers were lovely and they ended.' },
      { author: 4, replyTo: 1, body: 'I started setting the plate again on purpose, for a neighbor, so the table was not a memorial every night. Some weeks I still skip it.' },
      { author: 3, body: 'No verse from me. I am sorry the calendar filled up around you.' },
    ], 24, 31),
    ...thread(people, ago, postId(28), [
      { author: 2, body: 'I leave “It Is Well” alone. People want it at the wrong funerals and at the easy ones. It is not a mood.' },
      { author: 4, replyTo: 0, body: 'That is the one I meant and did not name. Thank you for saying it is not a mood.' },
      { author: 1, body: 'Mine is the morning hymn with the verse about light arriving slowly. The chorus is what the screen keeps. The verse is what I came for.' },
      { author: 0, replyTo: 2, body: 'Slow light is a good reason to stay for a third verse. I will look it up before Sabbath.' },
    ], 28, 22),
    ...thread(people, ago, postId(29), [
      { author: 5, body: 'Ask where the visitors sit, and whether lunch is a ticket or a table. Both answers are friendly. They are different afternoons.' },
      { author: 0, replyTo: 0, body: 'A table, then. I can manage a table. A ticket makes me count my cash in the lobby.' },
      { author: 3, replyTo: 1, body: 'Sit where you can see the door. Leave when you are tired. Coming once is enough information for a first Sabbath.' },
    ], 32, 20),
    ...thread(people, ago, postId(32), [
      { author: 4, body: 'Do it again on purpose, and tell the group you are doing it. An accident becomes a habit when someone names it.' },
      { author: 2, replyTo: 0, body: 'I named it last night. Two people brought questions that were not on the page. One person still wanted the page. We did ten minutes of each.' },
      { author: 4, replyTo: 1, body: 'Ten minutes of the page is a kindness. The questions are why I stay in a living room instead of a class.' },
    ], 35, 14),
    ...thread(people, ago, postId(38), [
      { author: 5, body: 'Praying, from the back row of my own church. The door is a faithful place to sit.' },
      { author: 1, body: 'I leave during the last hymn too. No one has asked me to explain it, and that has been the kindness.' },
      { author: 3, replyTo: 1, body: 'Thank you. I will take the quiet and skip the advice.' },
    ], 38, 6),
    ...thread(people, ago, postId(39), [
      { author: 1, body: 'I knew it was mine when someone saved me a chair without announcing it. Before that, kind was not the same as home.' },
      { author: 0, replyTo: 0, body: 'A saved chair is a good test. I have had bulletins and handshakes. I have not had a chair.' },
      { author: 4, replyTo: 1, body: 'Give it one more Sabbath if the people were unhurried. If you are managing them, that is information too.' },
    ], 41, 5),
  ];

  return { posts, comments };
}
