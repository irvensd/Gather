import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';

export default function SavedScreen() {
  const actions = useContentActions('/settings/saved');
  const saved = useQuery({ queryKey: ['saved'], queryFn: async () => (await getApi()).listSavedPosts() });
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Saved posts" />
      {saved.isLoading ? <LoadingSkeleton /> : null}
      {saved.isError ? (
        <EmptyState actionLabel="Try again" message="Saved posts could not be loaded." onAction={() => void saved.refetch()} title="Something went wrong" />
      ) : null}
      {!saved.isLoading && !saved.isError ? (
        <FlatList
          data={saved.data ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState message="Save a discussion and it will wait here." title="Nothing saved" />}
          renderItem={({ item }) => (
            <PostCard
              onAuthor={() => undefined}
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
