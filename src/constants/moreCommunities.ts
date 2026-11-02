import type { CommunityDefinition } from '@/constants/communities';

const rules = (line: string) => `${line}\nDisagree with an idea, not with a person.\nDo not share someone else’s private story.`;

function room(n: number, slug: string, name: string, description: string, icon: string, rule: string): CommunityDefinition {
  return {
    id: `a1000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    slug,
    name,
    description,
    icon,
    rules: rules(rule),
  };
}

/** Extra sample rooms so Explore looks like a lived-in app, not a starter list. */
export const EXTRA_COMMUNITIES: readonly CommunityDefinition[] = [
  room(9, 'pathfinders', 'Pathfinders', 'Club nights, honors, and what we wish we had said to the kids.', 'compass-outline', 'Stories about minors stay general. No names, no photos of children.'),
  room(10, 'healthful-living', 'HealthfulLiving', 'Food, rest, walking, and the health message without a lecture.', 'leaf-outline', 'Share what you tried. Do not prescribe a diet or a cure.'),
  room(11, 'music-and-worship', 'MusicAndWorship', 'Hymns, choirs, and the songs that still undo people.', 'library-outline', 'Talk about the music. Do not rank churches by their taste.'),
  room(12, 'vegetarian-table', 'VegetarianTable', 'Weeknight meals, potluck dishes, and the recipes that survived a move.', 'cafe-outline', 'Recipes are welcome. Shaming a plate is not.'),
  room(13, 'parenting', 'Parenting', 'Raising children in a Sabbath-keeping house, including the awkward years.', 'people-outline', 'Do not post a child’s name, school, or photo.'),
  room(14, 'grief-and-hope', 'GriefAndHope', 'Funerals, long illnesses, and the weeks after the casseroles stop.', 'heart-outline', 'No one has to explain their grief. Do not rush a person to a verse.'),
  room(15, 'campus-life', 'CampusLife', 'Dorms, exams, Friday classes, and finding a church in a new city.', 'compass-outline', 'This is a conversation among adults, including students who are adults.'),
  room(16, 'ministry-workers', 'MinistryWorkers', 'Pastors, teachers, and the people who set up the chairs.', 'chatbubbles-outline', 'Do not identify a member’s private crisis. Talk about the work, not a rumor.'),
  room(17, 'small-groups', 'SmallGroups', 'Living-room studies, who brings the bread, and how a group stays honest.', 'people-outline', 'Do not post what someone said in confidence.'),
  room(18, 'mission-stories', 'MissionStories', 'Years abroad, short trips, and the stories we tell too neatly.', 'sunny-outline', 'Name a place if you want. Do not turn a person into a lesson.'),
  room(19, 'creation-care', 'CreationCare', 'Gardens, walks, and what Sabbath has to do with a tired planet.', 'leaf-outline', 'Describe what you do. Skip the speech that wins the argument.'),
  room(20, 'sabbath-afternoon', 'SabbathAfternoon', 'Walks, naps, visits, and the hours after the meal.', 'sunny-outline', 'Ordinary afternoons are enough. Do not grade how someone rests.'),
  room(21, 'new-believers', 'NewBelievers', 'First potluck, first questions, and the words that still need translating.', 'book-outline', 'Questions are the point. Do not quiz a person on vocabulary.'),
  room(22, 'bible-study-groups', 'BibleStudyGroups', 'Weeknight circles that are not Sabbath School and do not want to be.', 'book-outline', 'Stay with the passage in front of you.'),
  room(23, 'hymns-and-songs', 'HymnsAndSongs', 'The third verse, the ones we dropped, and the ones we should not have.', 'library-outline', 'Say what a song did for you. Do not police a congregation’s set list.'),
  room(24, 'church-finance', 'ChurchFinance', 'Budgets, offerings, and asking where the money went without a fight.', 'chatbubbles-outline', 'No account numbers, no salaries, no unnamed accusations.'),
  room(25, 'anxiety-and-faith', 'AnxietyAndFaith', 'Worry, church, and the days when prayer does not feel like a switch.', 'heart-outline', 'This is not treatment. Do not tell someone to stop their care.'),
  room(26, 'new-city', 'NewCity', 'Finding a congregation after a move, and leaving one without a scene.', 'compass-outline', 'You can name a city. Do not post a person’s address.'),
  room(27, 'family-worship', 'FamilyWorship', 'Ten minutes after supper, and the nights it falls apart.', 'home-outline', 'Describe your house. Do not instruct someone else’s children.'),
  room(28, 'hospitality', 'Hospitality', 'The extra plate, the guest room, and when an open door needs a limit.', 'cafe-outline', 'Invitation is not obligation. Boundaries can be said out loud.'),
  room(29, 'teachers-lounge', 'TeachersLounge', 'Sabbath School teachers comparing notes after the bell.', 'library-outline', 'Classrooms differ. Do not score another teacher’s class.'),
  room(30, 'language-and-culture', 'LanguageAndCulture', 'Two languages in one church, and the jokes that do not cross.', 'chatbubbles-outline', 'Culture can be discussed without mocking the people who live it.'),
  room(31, 'vespers', 'Vespers', 'Friday night light, silence, and the programs that ran too long.', 'sunny-outline', 'A Friday meeting can be simple. Do not turn it into a performance review.'),
  room(32, 'widows-and-friends', 'WidowsAndFriends', 'The table for one, and the friends who still call on Saturday.', 'people-outline', 'Share your own loss. Do not tell someone how long to grieve.'),
];
