import { LIMITS } from '@/constants/limits';

const NAME = /^[A-Za-z][A-Za-z0-9 ]*$/;

const RESERVED = new Set(['new', 'explore', 'settings', 'search', 'gather', 'admin', 'moderator', 'support', 'help']);

export const COMMUNITY_ICONS = [
  'book-outline',
  'library-outline',
  'reader-outline',
  'sunny-outline',
  'moon-outline',
  'people-outline',
  'happy-outline',
  'heart-outline',
  'hand-left-outline',
  'chatbubbles-outline',
  'mic-outline',
  'musical-notes-outline',
  'home-outline',
  'school-outline',
  'medkit-outline',
  'fitness-outline',
  'nutrition-outline',
  'cafe-outline',
  'leaf-outline',
  'flower-outline',
  'water-outline',
  'globe-outline',
  'compass-outline',
  'calendar-outline',
  'camera-outline',
  'pencil-outline',
  'color-palette-outline',
  'bicycle-outline',
  'basketball-outline',
  'bed-outline',
  'paw-outline',
  'briefcase-outline',
  'hammer-outline',
  'bonfire-outline',
  'gift-outline',
  'eye-outline',
] as const;

export type CommunityIcon = (typeof COMMUNITY_ICONS)[number];

export const COMMUNITY_ICON_LABELS: Record<CommunityIcon, string> = {
  'book-outline': 'Book',
  'library-outline': 'Library',
  'reader-outline': 'Reading',
  'sunny-outline': 'Sun',
  'moon-outline': 'Moon',
  'people-outline': 'People',
  'happy-outline': 'Smile',
  'heart-outline': 'Heart',
  'hand-left-outline': 'Hand',
  'chatbubbles-outline': 'Conversation',
  'mic-outline': 'Microphone',
  'musical-notes-outline': 'Music',
  'home-outline': 'Home',
  'school-outline': 'School',
  'medkit-outline': 'Health',
  'fitness-outline': 'Fitness',
  'nutrition-outline': 'Food',
  'cafe-outline': 'Cup',
  'leaf-outline': 'Leaf',
  'flower-outline': 'Flower',
  'water-outline': 'Water',
  'globe-outline': 'Globe',
  'compass-outline': 'Compass',
  'calendar-outline': 'Calendar',
  'camera-outline': 'Camera',
  'pencil-outline': 'Pencil',
  'color-palette-outline': 'Art',
  'bicycle-outline': 'Bicycle',
  'basketball-outline': 'Sports',
  'bed-outline': 'Rest',
  'paw-outline': 'Pets',
  'briefcase-outline': 'Work',
  'hammer-outline': 'Tools',
  'bonfire-outline': 'Campfire',
  'gift-outline': 'Gift',
  'eye-outline': 'Eye',
};

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
