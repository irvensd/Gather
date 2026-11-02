import { postPhotoUri, storedPostPhotoPath } from '@/lib/postPhoto';

const user = '11111111-1111-4111-8111-111111111111';
const file = '22222222-2222-4222-8222-222222222222';
const path = `${user}/${file}.jpg`;

describe('post photos', () => {
  const previous = process.env.EXPO_PUBLIC_SUPABASE_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = previous;
  });

  it('reads a stored path from the public URL and ignores a phone file', () => {
    expect(storedPostPhotoPath(`https://example.supabase.co/storage/v1/object/public/post-photos/${path}`)).toBe(path);
    expect(storedPostPhotoPath('file:///photos/local.jpg')).toBeNull();
    expect(storedPostPhotoPath(null)).toBeNull();
  });

  it('builds a public URL from a stored path and leaves a phone file alone', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    expect(postPhotoUri(path)).toBe(`https://example.supabase.co/storage/v1/object/public/post-photos/${path}`);
    expect(postPhotoUri('file:///photos/local.jpg')).toBe('file:///photos/local.jpg');
    expect(postPhotoUri('../secret.jpg')).toBeNull();
  });
});
