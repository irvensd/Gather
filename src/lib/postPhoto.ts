const STORED_PHOTO =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.jpg$/;

/** Pull the storage path back out of a public post-photo URL. A phone file path returns null. */
export function storedPostPhotoPath(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const marker = '/storage/v1/object/public/post-photos/';
  const start = uri.indexOf(marker);
  if (start < 0) return null;
  const path = decodeURIComponent(uri.slice(start + marker.length).split('?')[0] ?? '');
  return STORED_PHOTO.test(path) ? path : null;
}

/** Turn a stored path into a URL the image view can load. File and http URLs pass through. */
export function postPhotoUri(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?|file|content|ph|data):/.test(path)) return path;
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base || !STORED_PHOTO.test(path)) return null;
  return `${base}/storage/v1/object/public/post-photos/${path}`;
}
