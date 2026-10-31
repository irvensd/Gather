import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyFeedState } from '@/components/ui/EmptyFeedState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useTabContentPadding } from '@/features/navigation/useTabContentPadding';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';
import type { FeedFilter, PostCard as PostCardModel } from '@/types';

export function FeedList({
  filter,
  communityId,
  header,
  notice,
}: {
  filter: FeedFilter;
  communityId?: string;
  header?: ReactElement | null;
  notice?: string | null;
}) {
  const theme = useTheme();
  const tabPadding = useTabContentPadding();
  const [refreshing, setRefreshing] = useState(false);
  const actions = useContentActions(communityId ? `/community/${communityId}` : '/');
  const feed = useInfiniteQuery({
    queryKey: ['feed', filter, communityId ?? null],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await getApi()).getFeed({ filter, communityId, offset: pageParam, limit: 15 }),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  if (feed.isLoading) return <LoadingSkeleton />;
  if (feed.isError) {
    return (
      <View style={{ padding: theme.spacing.xl }}>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>The feed could not be loaded. Pull to try again.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={{ flex: 1 }}
        ListEmptyComponent={<EmptyFeedState filter={filter} onExplore={() => router.push('/explore')} />}
        ListHeaderComponent={
          notice || header ? (
            <View>
              {notice ? (
                <Text style={[theme.type.caption, { color: theme.colors.secondary, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}>
                  {notice}
                </Text>
              ) : null}
              {header}
            </View>
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: tabPadding, flexGrow: posts.length === 0 ? 1 : undefined }}
        data={posts}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              void feed.refetch().finally(() => setRefreshing(false));
            }}
          />
        }
        renderItem={({ item }) => (
          <PostCard
            onAuthor={() => item.authorUsername && router.push(`/user/${item.authorUsername}`)}
            onCommunity={() => router.push(`/community/${item.communitySlug}`)}
            onMenu={() => actions.openPostMenu(item)}
            onPress={() => router.push(`/post/${item.id}`)}
            onReference={(reference) =>
              router.push({ pathname: '/scripture', params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) } })
            }
            onSave={() => actions.savePost(item)}
            onVote={(value) => actions.votePost(item, value)}
            post={item}
          />
        )}
        testID="feed-list"
      />
      {actions.dialogs}
    </>
  );
}

export type { PostCardModel };
