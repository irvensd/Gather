export function avatarUri(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?|file|content|ph|data):/.test(path)) return path;
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

export function initials(name: string | null | undefined): string {
  const source = (name || '?').replace(/^@/, '');
  const parts = source.split(/[\s_]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '');
  return letters.slice(0, 2).toUpperCase();
}
