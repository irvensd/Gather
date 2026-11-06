import { useInfiniteQuery } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyFeedState } from '@/components/ui/EmptyFeedState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
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
  const [refreshing, setRefreshing] = useState(false);
  const pathname = usePathname();
  const actions = useContentActions(pathname);
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl }}
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
      >
        <Text style={[theme.type.body, { color: theme.colors.text }]}>The feed could not be loaded. Pull to try again.</Text>
      </ScrollView>
    );
  }

  return (
    <>
      <FlatList
        style={{ flex: 1 }}
        ListEmptyComponent={<EmptyFeedState filter={filter} onExplore={() => router.push('/explore')} />}
        ListFooterComponent={
          feed.isFetchingNextPage || (notice && posts.length > 0) ? (
            <View>
              {feed.isFetchingNextPage ? (
                <ActivityIndicator accessibilityLabel="Loading more posts" color={theme.colors.primary} style={{ paddingVertical: theme.spacing.lg }} />
              ) : null}
              {notice && posts.length > 0 && !feed.hasNextPage ? (
                <Text style={[theme.type.caption, { color: theme.colors.muted, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg }]}>
                  {notice}
                </Text>
              ) : null}
            </View>
          ) : undefined
        }
        ListHeaderComponent={header ? <View>{header}</View> : undefined}
        contentContainerStyle={{ paddingTop: theme.spacing.sm, paddingBottom: 120, flexGrow: posts.length === 0 ? 1 : undefined }}
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
            onSave={() => actions.savePost(item)}
            onPress={() => router.push(`/post/${item.id}`)}
            onReference={(reference) =>
              router.push({ pathname: '/scripture', params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) } })
            }
            onPray={() => actions.prayPost(item)}
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
