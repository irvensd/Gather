import { findScriptureReferences, parseReference, splitScriptureSegments } from '@/lib/scripture/parse';

describe('scripture references', () => {
  it.each(['John 3:16', 'Daniel 7:9-14', '1 Thessalonians 4:16-17', 'Revelation 14:6-12', 'Jn 3:16', '1 Cor 13:4-7'])(
    'accepts %s',
    (input) => {
      expect(parseReference(input)?.book).toBeTruthy();
    },
  );

  it('keeps numbered books ahead of the shorter name', () => {
    const references = findScriptureReferences('1 John 4:8 and John 3:16');
    expect(references.map((reference) => reference.book)).toEqual(['1 John', 'John']);
  });

  it('ignores ordinary numbers and unknown books', () => {
    expect(findScriptureReferences('I have 2 cats and 3 dogs in 2024')).toEqual([]);
    expect(findScriptureReferences('see 14:6-12')).toEqual([]);
    expect(parseReference('NotABook 1:1')).toBeNull();
    expect(parseReference('John 3:999')).toBeNull();
    expect(parseReference('John 99:1')).toBeNull();
  });

  it('leaves invalid shapes as plain text', () => {
    const segments = splitScriptureSegments('John 3:999 and John 3:16');
    expect(segments.filter((segment) => segment.type === 'scripture')).toHaveLength(1);
    expect(segments.map((segment) => segment.text).join('')).toContain('John 3:999');
  });
});
