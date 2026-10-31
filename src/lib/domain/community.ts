import { LIMITS } from '@/constants/limits';

const NAME = /^[A-Za-z][A-Za-z0-9 ]*$/;

const RESERVED = new Set(['new', 'explore', 'settings', 'search', 'gather', 'admin', 'moderator', 'support', 'help']);

export const COMMUNITY_ICONS = [
  'book-outline',
  'sunny-outline',
  'people-outline',
  'library-outline',
  'chatbubbles-outline',
  'eye-outline',
  'compass-outline',
  'heart-outline',
  'leaf-outline',
  'cafe-outline',
] as const;

export function communitySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function validateCommunityName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < LIMITS.communityNameMin || name.length > LIMITS.communityNameMax || !NAME.test(name)) {
    return `Use ${LIMITS.communityNameMin}–${LIMITS.communityNameMax} characters. Letters, numbers, and spaces. Start with a letter.`;
  }
  if (RESERVED.has(communitySlug(name))) return 'That name is reserved.';
  return null;
}
