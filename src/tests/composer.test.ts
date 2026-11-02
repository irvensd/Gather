import { isEmptyDraft } from '@/store/draft';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('post drafts', () => {
  const blank = { title: '', body: '', scriptureReferences: [], imageUri: null };

  it('treats whitespace-only text as nothing to save', () => {
    expect(isEmptyDraft(blank)).toBe(true);
    expect(isEmptyDraft({ ...blank, title: '   ', body: '\n' })).toBe(true);
  });

  it('keeps a draft once anything real is added', () => {
    expect(isEmptyDraft({ ...blank, body: 'Half a thought' })).toBe(false);
    expect(isEmptyDraft({ ...blank, imageUri: 'file:///photo.jpg' })).toBe(false);
    expect(isEmptyDraft({ ...blank, scriptureReferences: [{ raw: 'John 3:16' } as never] })).toBe(false);
  });
});

