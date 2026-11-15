import { CURATED_COMMUNITIES } from '@/constants/communities';
import { composerPlaceholders } from '@/constants/composerPlaceholders';
import { isEmptyDraft } from '@/store/draft';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('composer placeholders', () => {
  it('follows the community and the kind of post', () => {
    expect(composerPlaceholders('bible-questions', 'discussion').title).toBe('How do you read the story of Job?');
    expect(composerPlaceholders('young-adults', 'discussion').title).toBe('Should churches do more to support young adults?');
    expect(composerPlaceholders('bible-questions', 'question').title).not.toBe(composerPlaceholders('bible-questions', 'discussion').title);
    expect(composerPlaceholders('bible-questions', 'prayer_request').body).not.toBe(composerPlaceholders('bible-questions', 'question').body);
    for (const community of CURATED_COMMUNITIES) {
      const title = composerPlaceholders(community.slug, 'discussion').title;
      expect(title.length).toBeGreaterThan(10);
      expect(title).not.toBe(composerPlaceholders(null, 'discussion').title);
    }
    expect(composerPlaceholders('a-room-someone-started', 'discussion').title).toBe('What do you want this room to talk about?');
  });
});

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
