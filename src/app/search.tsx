import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const actions = useContentActions('/search');
  const results = useQuery({
    queryKey: ['search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => (await getApi()).search(query),
  });
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingRight: theme.spacing.lg }}>
          <SearchField autoFocus onChangeText={setQuery} value={query} />
        </View>
      </View>
      <FlatList
        data={results.data?.posts ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {results.data?.communities.map((community) => (
              <Pressable key={community.id} onPress={() => router.push(`/community/${community.slug}`)} style={{ padding: theme.spacing.lg }}>
                <Text style={[theme.type.section, { color: theme.colors.text }]}>c/{community.name}</Text>
                <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{community.description}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            onAuthor={() => item.authorUsername && router.push(`/user/${item.authorUsername}`)}
            onCommunity={() => router.push(`/community/${item.communitySlug}`)}
            onMenu={() => actions.openPostMenu(item)}
            onPress={() => router.push(`/post/${item.id}`)}
            onReference={() => undefined}
            onSave={() => actions.savePost(item)}
            onVote={(value) => actions.votePost(item, value)}
            post={item}
          />
        )}
      />
      {actions.dialogs}
    </ScreenContainer>
  );
}
