import { readableCommunityName } from '@/constants/communities';
import { COMMUNITY_TOPICS, communityTopic, type CommunityTopic } from '@/constants/communityTopics';
import type { Community } from '@/types';

export interface TopicSection {
  topic: CommunityTopic;
  title: string;
  data: Community[];
}

/** Groups already-sorted communities by topic, in topic order, dropping empty groups. */
export function groupByTopic(communities: readonly Community[], only?: CommunityTopic | null): TopicSection[] {
  return COMMUNITY_TOPICS.filter((topic) => !only || topic.id === only)
    .map((topic) => ({
      topic: topic.id,
      title: topic.label,
      data: communities.filter((community) => communityTopic(community.slug, community.topic) === topic.id),
    }))
    .filter((section) => section.data.length > 0);
}

/** Joined communities first, then the fullest rooms, then name. A query narrows by name or description. */
export function browseCommunities(communities: readonly Community[], query: string): Community[] {
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? communities.filter((community) => {
        const haystack = `${readableCommunityName(community.name)} ${community.name} ${community.slug} ${community.description} ${community.createdByDisplayName ?? ''} ${community.createdByUsername ?? ''}`.toLowerCase();
        return haystack.includes(needle);
      })
    : [...communities];
  return filtered.sort((left, right) => {
    if (left.joined !== right.joined) return left.joined ? -1 : 1;
    if (right.memberCount !== left.memberCount) return right.memberCount - left.memberCount;
    return readableCommunityName(left.name).localeCompare(readableCommunityName(right.name));
  });
}

export function memberLabel(count: number): string {
  if (count === 1) return '1 member';
  return `${count} members`;
}

/** Curated rooms have no person behind them. A created room names that person. */
export function startedByLabel(community: Pick<Community, 'createdByDisplayName'>): string {
  return community.createdByDisplayName ? `Started by ${community.createdByDisplayName}` : 'Started by Gather';
}

export function membershipNotice(name: string, joined: boolean): string {
  const label = readableCommunityName(name);
  return joined ? `Joined ${label}` : `Left ${label}`;
}
