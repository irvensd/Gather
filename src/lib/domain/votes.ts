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
