import { BIBLE_BOOKS, type BibleBook } from '@/lib/scripture/books';
import type { ScriptureReference } from '@/types';

const EXTRA_ALIASES: Record<string, readonly string[]> = {
  Psalms: ['ps'],
  '1 Samuel': ['i samuel', 'first samuel'],
  '2 Samuel': ['ii samuel', 'second samuel'],
  '1 Kings': ['i kings', 'first kings'],
  '2 Kings': ['ii kings', 'second kings'],
  '1 Chronicles': ['i chronicles', 'first chronicles'],
  '2 Chronicles': ['ii chronicles', 'second chronicles'],
  '1 Corinthians': ['i corinthians', 'first corinthians'],
  '2 Corinthians': ['ii corinthians', 'second corinthians'],
  '1 Thessalonians': ['i thessalonians', 'first thessalonians'],
  '2 Thessalonians': ['ii thessalonians', 'second thessalonians'],
  '1 Timothy': ['i timothy', 'first timothy'],
  '2 Timothy': ['ii timothy', 'second timothy'],
  '1 Peter': ['i peter', 'first peter'],
  '2 Peter': ['ii peter', 'second peter'],
  '1 John': ['i john', 'first john'],
  '2 John': ['ii john', 'second john'],
  '3 John': ['iii john', 'third john'],
};

const aliasToBook = new Map<string, BibleBook>();

function addAlias(alias: string, book: BibleBook) {
  const key = alias.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!key || aliasToBook.has(key)) return;
  aliasToBook.set(key, book);
}

for (const book of BIBLE_BOOKS) {
  addAlias(book.name, book);
  for (const alias of book.aliases) addAlias(alias, book);
  for (const alias of EXTRA_ALIASES[book.name] ?? []) addAlias(alias, book);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const aliasPattern = [...aliasToBook.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');

const REFERENCE_PATTERN = new RegExp(
  `(?<![A-Za-z0-9])((?:${aliasPattern})\\.?\\s+\\d{1,3}:\\d{1,3}(?:\\s*[-\\u2013]\\s*\\d{1,3})?)`,
  'gi',
);

export function canonicalReference(book: string, chapter: number, verseStart: number, verseEnd: number): string {
  if (verseStart === verseEnd) return `${book} ${chapter}:${verseStart}`;
  return `${book} ${chapter}:${verseStart}-${verseEnd}`;
}

export function validateReference(
  bookName: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): ScriptureReference | null {
  const key = bookName.toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ').trim();
  const book = aliasToBook.get(key);
  if (!book) return null;
  if (!Number.isInteger(chapter) || !Number.isInteger(verseStart) || !Number.isInteger(verseEnd)) return null;
  const verseCount = book.verses[chapter - 1];
  if (!verseCount) return null;
  if (verseStart < 1 || verseEnd < verseStart || verseEnd > verseCount) return null;
  return {
    raw: canonicalReference(book.name, chapter, verseStart, verseEnd),
    book: book.name,
    bookId: book.id,
    chapter,
    verseStart,
    verseEnd,
  };
}

export function parseReference(input: string): ScriptureReference | null {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  const match = trimmed.match(/^(.+?)\s+(\d{1,3}):(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?$/);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const verseStart = Number(match[3]);
  const verseEnd = match[4] ? Number(match[4]) : verseStart;
  return validateReference(match[1], Number(match[2]), verseStart, verseEnd);
}

function eachMatch(text: string): RegExpMatchArray[] {
  REFERENCE_PATTERN.lastIndex = 0;
  return [...text.matchAll(REFERENCE_PATTERN)];
}

export function findScriptureReferences(text: string): ScriptureReference[] {
  const found: ScriptureReference[] = [];
  const seen = new Set<string>();
  for (const match of eachMatch(text)) {
    const parsed = parseReference(match[1] ?? '');
    if (!parsed) continue;
    const key = `${parsed.bookId}:${parsed.chapter}:${parsed.verseStart}:${parsed.verseEnd}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(parsed);
  }
  return found;
}

export type TextSegment =
  | { type: 'text'; text: string }
  | { type: 'scripture'; text: string; reference: ScriptureReference };

export function splitScriptureSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of eachMatch(text)) {
    const token = match[1] ?? '';
    const parsed = parseReference(token);
    const start = match.index ?? 0;
    if (!parsed) continue;
    if (start > cursor) segments.push({ type: 'text', text: text.slice(cursor, start) });
    segments.push({ type: 'scripture', text: token.trim(), reference: parsed });
    cursor = start + token.length;
  }
  if (cursor < text.length) segments.push({ type: 'text', text: text.slice(cursor) });
  if (segments.length === 0) segments.push({ type: 'text', text });
  return segments;
}

export function mergeReferences(explicit: ScriptureReference[], text: string): ScriptureReference[] {
  const map = new Map<string, ScriptureReference>();
  for (const reference of [...explicit, ...findScriptureReferences(text)]) {
    map.set(`${reference.bookId}:${reference.chapter}:${reference.verseStart}:${reference.verseEnd}`, reference);
  }
  return [...map.values()].slice(0, 20);
}

export function versesInChapter(bookId: string, chapter: number): number | null {
  const book = BIBLE_BOOKS.find((item) => item.id === bookId);
  if (!book) return null;
  return book.verses[chapter - 1] ?? null;
}

export function passageQuery(reference: ScriptureReference): string {
  return reference.raw;
}
