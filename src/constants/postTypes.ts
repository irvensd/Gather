import type { PostType } from '@/types';

export const POST_TYPES: {
  type: PostType;
  label: string;
  hint: string;
}[] = [
  {
    type: 'question',
    label: 'Question',
    hint: 'Ask something you want help understanding.',
  },
  {
    type: 'discussion',
    label: 'Discussion',
    hint: 'Open a conversation.',
  },
  {
    type: 'testimony',
    label: 'Testimony',
    hint: 'Share an experience in your own words.',
  },
  {
    type: 'prayer_request',
    label: 'Prayer Request',
    hint: 'Ask for prayer. Share only what you want public.',
  },
];

export function postTypeLabel(type: PostType): string {
  return POST_TYPES.find((item) => item.type === type)?.label ?? 'Post';
}

export function postByline(type: PostType, authorName: string): string {
  if (type === 'question') return `${authorName} asked`;
  if (type === 'testimony') return `${authorName} shared`;
  if (type === 'prayer_request') return `${authorName} asked for prayer`;
  return `${authorName} posted`;
}
