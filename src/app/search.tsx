import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const actions = useContentActions('/search');
  const results = useQuery({
    queryKey: ['search', trimmed],
    enabled: trimmed.length >= 2,
    queryFn: async () => (await getApi()).search(trimmed),
  });
  const communities = results.data?.communities ?? [];
  const posts = results.data?.posts ?? [];
  const empty = trimmed.length >= 2 && !results.isLoading && !results.isError && communities.length === 0 && posts.length === 0;

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingRight: theme.spacing.lg }}>
          <SearchField autoFocus onChangeText={setQuery} value={query} />
        </View>
      </View>
      {trimmed.length < 2 ? (
        <EmptyState message="Type at least two characters to search conversations and communities." title="Search Gather" />
      ) : null}
      {results.isLoading ? <LoadingSkeleton /> : null}
      {results.isError ? (
        <EmptyState actionLabel="Try again" message="Search could not be completed." onAction={() => void results.refetch()} title="Something went wrong" />
      ) : null}
      {empty ? <EmptyState message="Try another phrase, a community name, or a few words from a post." title="No matches" /> : null}
      {trimmed.length >= 2 && !results.isLoading && !results.isError && !empty ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            communities.length > 0 ? (
              <View style={{ paddingBottom: theme.spacing.sm }}>
                <Text style={[theme.type.section, { color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }]}>
                  Communities
                </Text>
                {communities.map((community) => (
                  <Pressable
                    key={community.id}
                    onPress={() => router.push(`/community/${community.slug}`)}
                    style={{
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <CommunityAvatar icon={community.icon} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{community.name}</Text>
                      <Text numberOfLines={2} style={[theme.type.caption, { color: theme.colors.secondary }]}>
                        {community.description}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <Text style={[theme.type.section, { color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }]}>
                  Conversations
                </Text>
              </View>
            ) : undefined
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
        />
      ) : null}
      {actions.dialogs}
    </ScreenContainer>
  );
}
