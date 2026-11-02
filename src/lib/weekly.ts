export interface WeeklyPassage {
  postId: string;
  reference: string;
  title: string;
}

export const WEEKLY_PASSAGES: readonly WeeklyPassage[] = [
  { postId: 'c2000000-0000-4000-8000-000000000011', reference: 'Exodus 20:8-11', title: 'Remember the Sabbath day' },
  { postId: 'c2000000-0000-4000-8000-000000000012', reference: 'Isaiah 58:13-14', title: 'Call the Sabbath a delight' },
  { postId: 'c2000000-0000-4000-8000-000000000013', reference: 'Mark 2:27-28', title: 'The Sabbath was made for people' },
  { postId: 'c2000000-0000-4000-8000-000000000014', reference: 'Genesis 2:1-3', title: 'God rested on the seventh day' },
  { postId: 'c2000000-0000-4000-8000-000000000015', reference: 'Hebrews 4:9-11', title: 'A Sabbath rest remains' },
];

function isoWeek(date: Date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function passageThisWeek(now = new Date()): WeeklyPassage {
  return WEEKLY_PASSAGES[isoWeek(now) % WEEKLY_PASSAGES.length]!;
}
