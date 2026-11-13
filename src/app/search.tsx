import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { readableCommunityName } from '@/constants/communities';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const term = query.trim();
  const canSearch = term.length >= 2;
  const actions = useContentActions('/search');
  const results = useQuery({
    queryKey: ['search', term],
    enabled: canSearch,
    queryFn: async () => (await getApi()).search(term),
  });
  const communities = results.data?.communities ?? [];
  const posts = results.data?.posts ?? [];
  const headingStyle = [
    theme.type.section,
    { color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  ];

  function renderFeedback() {
    if (!canSearch) {
      return <EmptyState icon="search-outline" title="Search Gather" message="Enter at least two characters to find communities and posts." />;
    }
    if (results.isPaused) {
      return <EmptyState icon="cloud-offline-outline" title="You’re offline" message="Search will resume when you reconnect." />;
    }
    if (results.isFetching) {
      return (
        <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xxxl }}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text accessibilityLiveRegion="polite" style={[theme.type.body, { color: theme.colors.muted }]}>Searching…</Text>
        </View>
      );
    }
    if (results.isError) {
      return (
        <EmptyState
          actionLabel="Try again"
          icon="alert-circle-outline"
          message="There was a problem loading your results."
          onAction={() => void results.refetch()}
          title="Search couldn’t load"
        />
      );
    }
    return <EmptyState icon="search-outline" title="No results found" message="Try a different word or a shorter phrase." />;
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingRight: theme.spacing.lg }}>
          <SearchField autoFocus onChangeText={setQuery} value={query} />
        </View>
      </View>
      <FlatList
        data={posts}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={communities.length === 0 ? renderFeedback : undefined}
        ListHeaderComponent={
          <>
            {communities.length > 0 ? <Text accessibilityRole="header" style={headingStyle}>Communities</Text> : null}
            {communities.map((community) => (
              <Pressable
                accessibilityRole="button"
                key={community.id}
                onPress={() => router.push(`/community/${community.slug}`)}
                style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}
              >
                <Text style={[theme.type.section, { color: theme.colors.text }]}>{readableCommunityName(community.name)}</Text>
                <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{community.description}</Text>
              </Pressable>
            ))}
            {posts.length > 0 ? <Text accessibilityRole="header" style={headingStyle}>Posts</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <PostCard
            onAuthor={() => item.authorUsername && router.push(`/user/${item.authorUsername}`)}
            onCommunity={() => router.push(`/community/${item.communitySlug}`)}
            onMenu={() => actions.openPostMenu(item)}
            onSave={() => actions.savePost(item)}
            onPress={() => router.push(`/post/${item.id}`)}
            onReference={(reference) => router.push({ pathname: '/scripture', params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) } })}
            onPray={() => actions.prayPost(item)}
            onVote={(value) => actions.votePost(item, value)}
            post={item}
          />
        )}
      />
      {actions.dialogs}
    </ScreenContainer>
  );
}
