import type { FeedFilter } from '@/types';

export interface Rankable {
  id: string;
  score: number;
  createdAt: string;
  commentCount?: number;
  prayedCount?: number;
}

/**
 * Popular order.
 * A thumb counts as 1, a reply as 2, and an "I prayed" as 1.
 * That total fades as the post ages, so a new conversation can still surface
 * before an old post that collected votes weeks ago.
 */
export function hotScore(post: Pick<Rankable, 'score' | 'createdAt' | 'commentCount' | 'prayedCount'>, now = Date.now()): number {
  const hours = Math.max(0, now - new Date(post.createdAt).getTime()) / 3_600_000;
  const interest = post.score + (post.commentCount ?? 0) * 2 + (post.prayedCount ?? 0);
  return (interest + 1) / (hours + 2) ** 1.5;
}

export function sortFeed<T extends Rankable>(posts: readonly T[], filter: FeedFilter, now = Date.now()): T[] {
  const copy = [...posts];
  if (filter === 'popular') {
    copy.sort((a, b) => {
      const delta = hotScore(b, now) - hotScore(a, now);
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
