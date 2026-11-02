import type { VoteValue } from '@/types';

export type CastVote = -1 | 1;

export function nextVote(current: VoteValue, action: CastVote): VoteValue {
  return current === action ? 0 : action;
}

export function voteScoreDelta(previous: VoteValue, next: VoteValue): number {
  return next - previous;
}

export function applyVoteToScore(score: number, previous: VoteValue, next: VoteValue): number {
  return score + voteScoreDelta(previous, next);
}

/** Likes and dislikes stay as separate counts. Changing your vote moves only your own tally. */
export function applyVoteCounts(
  upvotes: number,
  downvotes: number,
  previous: VoteValue,
  next: VoteValue,
): { upvotes: number; downvotes: number } {
  let up = upvotes;
  let down = downvotes;
  if (previous === 1) up -= 1;
  else if (previous === -1) down -= 1;
  if (next === 1) up += 1;
  else if (next === -1) down += 1;
  return { upvotes: Math.max(0, up), downvotes: Math.max(0, down) };
}

export function tallyVotes(values: number[]): { score: number; upvotes: number; downvotes: number } {
  const upvotes = values.filter((value) => value === 1).length;
  const downvotes = values.filter((value) => value === -1).length;
  return { score: upvotes - downvotes, upvotes, downvotes };
}
