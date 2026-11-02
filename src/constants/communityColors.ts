export interface CommunityColorTone {
  background: string;
  foreground: string;
}

export interface CommunityColor {
  id: string;
  label: string;
  light: CommunityColorTone;
  dark: CommunityColorTone;
}

export const COMMUNITY_COLORS = [
  { id: 'green', label: 'Green', light: { background: '#EDF3EE', foreground: '#244F46' }, dark: { background: '#24312B', foreground: '#8EBCAA' } },
  { id: 'teal', label: 'Teal', light: { background: '#E3F1F3', foreground: '#1F5F68' }, dark: { background: '#1E3236', foreground: '#8CC7CF' } },
  { id: 'blue', label: 'Blue', light: { background: '#E6EDF7', foreground: '#2F4F86' }, dark: { background: '#222B3A', foreground: '#9DB4E0' } },
  { id: 'purple', label: 'Purple', light: { background: '#EFE9F5', foreground: '#5B3F82' }, dark: { background: '#2D2638', foreground: '#C2ABE0' } },
  { id: 'rose', label: 'Rose', light: { background: '#F7E8EC', foreground: '#8A3550' }, dark: { background: '#382329', foreground: '#E6A4B6' } },
  { id: 'clay', label: 'Clay', light: { background: '#F6E9E3', foreground: '#8A4128' }, dark: { background: '#372620', foreground: '#E5AA8F' } },
  { id: 'gold', label: 'Gold', light: { background: '#F6F0DC', foreground: '#765A12' }, dark: { background: '#332D1C', foreground: '#DCC27A' } },
  { id: 'slate', label: 'Slate', light: { background: '#ECEEF0', foreground: '#3F4A55' }, dark: { background: '#282C30', foreground: '#B6C0CA' } },
] as const satisfies readonly CommunityColor[];

export type CommunityColorId = (typeof COMMUNITY_COLORS)[number]['id'];

export function isCommunityColor(value: unknown): value is CommunityColorId {
  return COMMUNITY_COLORS.some((color) => color.id === value);
}

/** Rooms made before colors existed get a stable color from their id, so Explore is not all one shade. */
export function communityColorFor(id: string, chosen?: string | null): CommunityColorId {
  if (isCommunityColor(chosen)) return chosen;
  let sum = 0;
  for (const character of id) sum += character.charCodeAt(0);
  return COMMUNITY_COLORS[sum % COMMUNITY_COLORS.length].id;
}

export function communityColorTone(id: string | null | undefined, scheme: 'light' | 'dark'): CommunityColorTone {
  const color = COMMUNITY_COLORS.find((item) => item.id === id) ?? COMMUNITY_COLORS[0];
  return color[scheme];
}
