import type { PostType } from '@/types';

export const POST_TYPES: {
  type: PostType;
  label: string;
  hint: string;
  example: string;
}[] = [
  {
    type: 'question',
    label: 'Question',
    hint: 'Ask something you want help understanding.',
    example: 'Why does God allow suffering?',
  },
  {
    type: 'discussion',
    label: 'Discussion',
    hint: 'Open a conversation.',
    example: 'Should churches do more to support young adults?',
  },
  {
    type: 'testimony',
    label: 'Testimony',
    hint: 'Share an experience in your own words.',
    example: 'How my faith changed during a difficult year.',
  },
  {
    type: 'prayer_request',
    label: 'Prayer Request',
    hint: 'Ask for prayer. Share only what you want public.',
    example: 'Please pray for my family.',
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
