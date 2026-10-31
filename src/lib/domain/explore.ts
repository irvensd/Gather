import type { Community } from '@/types';

export function suggestedCommunities(communities: readonly Community[]): Community[] {
  const unseen = communities.filter((community) => !community.joined);
  return (unseen.length > 0 ? unseen : [...communities]).slice(0, 8);
}
