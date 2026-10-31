import type { FeedFilter } from '@/types';

export interface Rankable {
  id: string;
  score: number;
  createdAt: string;
}

/** Recency-weighted score. New posts stay visible when vote counts are still small. */
export function hotScore(score: number, createdAt: string, now = Date.now()): number {
  const hours = Math.max(0, now - new Date(createdAt).getTime()) / 3_600_000;
  return (score + 1) / (hours + 2) ** 1.5;
}

export function sortFeed<T extends Rankable>(posts: readonly T[], filter: FeedFilter, now = Date.now()): T[] {
  const copy = [...posts];
  if (filter === 'popular') {
    copy.sort((a, b) => {
      const delta = hotScore(b.score, b.createdAt, now) - hotScore(a.score, a.createdAt, now);
      if (delta !== 0) return delta;
      return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
    });
    return copy;
  }
  copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  return copy;
}

export function bodyPreview(body: string, max = 180): string {
  const compact = body.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}
