import type { PostType } from '@/types';

const BODY: Record<PostType, string> = {
  question: 'Add the passage or the situation, and what you have already tried.',
  discussion: 'Say what you think so far, and what you are still unsure about.',
  testimony: 'Tell it in the order it happened. You do not need a lesson at the end.',
  prayer_request: 'Share only what you want strangers to read.',
};

const FALLBACK: Record<PostType, string> = {
  question: 'What are you trying to understand?',
  discussion: 'What do you want this room to talk about?',
  testimony: 'What happened, in your own words?',
  prayer_request: 'What would you like people to pray about?',
};

const TITLES: Record<string, Record<PostType, string>> = {
  'bible-questions': {
    question: 'Why does God allow suffering?',
    discussion: 'How do you read the story of Job?',
    testimony: 'A passage I could not get through for years.',
    prayer_request: 'Please pray I can sit with this passage.',
  },
  'adventist-life': {
    question: 'Why do we still do haystacks?',
    discussion: 'What Adventist habit do you actually love?',
    testimony: 'The potluck that made me feel at home.',
    prayer_request: 'Please pray for my congregation this week.',
  },
  relationships: {
    question: 'How do you date without making church the whole conversation?',
    discussion: 'Where does a friendship need a clearer boundary?',
    testimony: 'What changed when I stopped rushing a relationship.',
    prayer_request: 'Please pray for my marriage.',
  },
  'sabbath-school': {
    question: 'What is this week’s passage actually saying?',
    discussion: 'Which question from the lesson stayed with you?',
    testimony: 'A class discussion I am still thinking about.',
    prayer_request: 'Please pray for our class this week.',
  },
  'church-and-culture': {
    question: 'How should a church handle a hard public disagreement?',
    discussion: 'What do younger and older members keep misunderstanding?',
    testimony: 'A meeting that changed how I see church leadership.',
    prayer_request: 'Please pray for the people leading my church.',
  },
  prophecy: {
    question: 'What is Daniel 8 describing?',
    discussion: 'Where does interpretation end and speculation begin?',
    testimony: 'The prophecy study that slowed me down.',
    prayer_request: 'Please pray I hold this text with less fear.',
  },
  'young-adults': {
    question: 'How do you keep faith during a career change?',
    discussion: 'Should churches do more to support young adults?',
    testimony: 'The year I left home and had to find a church.',
    prayer_request: 'Please pray for this next season of my life.',
  },
  'prayer-requests': {
    question: 'How do you pray when you do not know what to ask?',
    discussion: 'What helps you keep praying for someone over months?',
    testimony: 'A prayer I almost did not share.',
    prayer_request: 'Please pray for my family.',
  },
  pathfinders: {
    question: 'How do you teach honors without turning club into school?',
    discussion: 'What do you wish you had said to the kids sooner?',
    testimony: 'A club night I still remember.',
    prayer_request: 'Please pray for our club staff.',
  },
  'healthful-living': {
    question: 'How do you rest without turning it into another rule?',
    discussion: 'What actually helped your walks stick?',
    testimony: 'The week I stopped treating food like a test.',
    prayer_request: 'Please pray I can rest without guilt.',
  },
  'music-and-worship': {
    question: 'Why does a certain hymn still undo people?',
    discussion: 'What belongs in the service, and what is only taste?',
    testimony: 'The song that carried me through a hard Sabbath.',
    prayer_request: 'Please pray for the people leading music.',
  },
  'vegetarian-table': {
    question: 'What do you cook on a weeknight when you are tired?',
    discussion: 'Which potluck dish is worth making again?',
    testimony: 'The recipe that came with me when I moved.',
    prayer_request: 'Please pray for the people I am feeding this week.',
  },
  parenting: {
    question: 'How do you explain Sabbath to a child who wants to play?',
    discussion: 'What has helped in the awkward years?',
    testimony: 'A night when family worship fell apart, and what I did next.',
    prayer_request: 'Please pray for my children. I will not share their names.',
  },
  'grief-and-hope': {
    question: 'What do you say in the weeks after the casseroles stop?',
    discussion: 'How long did you need people to keep calling?',
    testimony: 'The funeral I am still walking through.',
    prayer_request: 'Please pray for me. You do not need the details.',
  },
  'campus-life': {
    question: 'How do you keep Sabbath with a Friday class?',
    discussion: 'How did you find a church in a new city?',
    testimony: 'My first year away from home.',
    prayer_request: 'Please pray for exams and for finding a church here.',
  },
  'ministry-workers': {
    question: 'How do you rest when you are the one setting up the chairs?',
    discussion: 'What part of the work is hard to say out loud?',
    testimony: 'A Sabbath I served and still needed someone.',
    prayer_request: 'Please pray for the people who carry the work.',
  },
  'small-groups': {
    question: 'How do you keep a living-room study honest?',
    discussion: 'Who brings the bread, and what else makes a group last?',
    testimony: 'The night our group finally told the truth.',
    prayer_request: 'Please pray for the people in my group.',
  },
  'mission-stories': {
    question: 'How do you tell a year abroad without making it too neat?',
    discussion: 'What did a short trip teach you that a speech would miss?',
    testimony: 'A person I will not turn into a lesson.',
    prayer_request: 'Please pray for the place I left.',
  },
  'creation-care': {
    question: 'What does Sabbath have to do with a tired planet?',
    discussion: 'What are you actually doing in the garden or on the walk?',
    testimony: 'The walk that made the week make sense.',
    prayer_request: 'Please pray I care for the place I live.',
  },
  'sabbath-afternoon': {
    question: 'What do you do with the hours after the meal?',
    discussion: 'Is a nap a faithful way to keep the afternoon?',
    testimony: 'An ordinary Sabbath afternoon I did not want to end.',
    prayer_request: 'Please pray I can rest without grading it.',
  },
  'new-believers': {
    question: 'What does this word mean at a potluck?',
    discussion: 'Which first question did you wish someone had welcomed?',
    testimony: 'My first Sabbath, and what still needed translating.',
    prayer_request: 'Please pray I can ask without feeling behind.',
  },
  'bible-study-groups': {
    question: 'What is this passage saying before we add a lesson?',
    discussion: 'How is a weeknight circle different from Sabbath School?',
    testimony: 'A study where the text was enough.',
    prayer_request: 'Please pray for our weeknight group.',
  },
  'hymns-and-songs': {
    question: 'Why did we drop the third verse?',
    discussion: 'Which song should we have kept?',
    testimony: 'A hymn that did something a sermon did not.',
    prayer_request: 'Please pray the singing stays honest.',
  },
  'church-finance': {
    question: 'How do you ask where the offering went without a fight?',
    discussion: 'What belongs in a budget report in ordinary language?',
    testimony: 'The meeting where the numbers finally made sense.',
    prayer_request: 'Please pray for the people who handle the money.',
  },
  'anxiety-and-faith': {
    question: 'What do you do when prayer does not feel like a switch?',
    discussion: 'How do worry and church sit in the same week?',
    testimony: 'A day I went to church anxious and stayed.',
    prayer_request: 'Please pray for a worried week. This is not a treatment plan.',
  },
  'new-city': {
    question: 'How do you find a congregation after a move?',
    discussion: 'How do you leave a church without a scene?',
    testimony: 'The first Sabbath in a city where I knew no one.',
    prayer_request: 'Please pray I find a church here.',
  },
  'family-worship': {
    question: 'What fits in ten minutes after supper?',
    discussion: 'What do you do on the nights it falls apart?',
    testimony: 'The evening we stopped trying to make it perfect.',
    prayer_request: 'Please pray for worship in our house.',
  },
  hospitality: {
    question: 'When does an open door need a limit?',
    discussion: 'How do you offer the extra plate without making it a duty?',
    testimony: 'A guest who stayed, and the boundary I learned to say.',
    prayer_request: 'Please pray for the people at my table.',
  },
  'teachers-lounge': {
    question: 'What are you teaching from this week’s lesson?',
    discussion: 'What would you do differently after the bell?',
    testimony: 'A class that did not go where I planned.',
    prayer_request: 'Please pray for the teachers this Sabbath.',
  },
  'language-and-culture': {
    question: 'How do two languages share one church?',
    discussion: 'Which jokes do not cross, and what do we do instead?',
    testimony: 'The Sabbath I finally understood the announcement.',
    prayer_request: 'Please pray for the people translating the room.',
  },
  vespers: {
    question: 'What belongs in a Friday night, and what runs too long?',
    discussion: 'Is silence a program?',
    testimony: 'A Friday when the light was enough.',
    prayer_request: 'Please pray for Friday night at our church.',
  },
  'widows-and-friends': {
    question: 'How do friends keep calling on Saturday?',
    discussion: 'What helps at a table set for one?',
    testimony: 'The Saturday someone still came by.',
    prayer_request: 'Please pray for me. You do not need to rush it.',
  },
};

export function composerPlaceholders(slug: string | null | undefined, type: PostType | undefined): { title: string; body: string } {
  const kind = type && kindIsPost(type) ? type : 'discussion';
  return {
    title: (slug ? TITLES[slug]?.[kind] : undefined) ?? FALLBACK[kind],
    body: BODY[kind],
  };
}

function kindIsPost(type: string): type is PostType {
  return type === 'question' || type === 'discussion' || type === 'testimony' || type === 'prayer_request';
}
