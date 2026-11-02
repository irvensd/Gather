import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { applyVoteCounts, applyVoteToScore } from '@/lib/domain/votes';
import type { Page, PostCard, VoteValue } from '@/types';

export function patchPost(queryClient: QueryClient, postId: string, updater: (post: PostCard) => PostCard) {
  queryClient.setQueriesData<InfiniteData<Page<PostCard>>>({ queryKey: ['feed'] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
      })),
    };
  });
  queryClient.setQueryData<PostCard>(['post', postId], (post) => (post ? updater(post) : post));
}

export function withVote(post: PostCard, next: VoteValue): PostCard {
  return {
    ...post,
    score: applyVoteToScore(post.score, post.userVote, next),
    ...applyVoteCounts(post.upvotes ?? 0, post.downvotes ?? 0, post.userVote, next),
    userVote: next,
  };
}
