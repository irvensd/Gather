import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';

export default function SavedScreen() {
  const actions = useContentActions('/settings/saved');
  const saved = useQuery({ queryKey: ['saved'], queryFn: async () => (await getApi()).listSavedPosts() });
  return (
    <ScreenContainer>
      <FlatList
        data={saved.data ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Save a discussion and it will wait here." title="Nothing saved" />}
        renderItem={({ item }) => (
          <PostCard onAuthor={() => undefined} onCommunity={() => router.push(`/community/${item.communitySlug}`)} onMenu={() => actions.openPostMenu(item)} onPress={() => router.push(`/post/${item.id}`)} onReference={() => undefined} onSave={() => actions.savePost(item)} onVote={(value) => actions.votePost(item, value)} post={item} />
        )}
      />
      {actions.dialogs}
    </ScreenContainer>
  );
}
