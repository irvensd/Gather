import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';

export default function SavedScreen() {
  const signedIn = useRequireSignIn('/settings/saved');
  const actions = useContentActions('/settings/saved');
  const saved = useQuery({ queryKey: ['saved'], enabled: signedIn, queryFn: async () => (await getApi()).listSavedPosts() });
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <ScreenHeader title="Saved posts" />
      <FlatList
        data={saved.data ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Save a discussion and it will wait here." title="Nothing saved" />}
        renderItem={({ item }) => (
          <PostCard
            onAuthor={() => item.authorUsername && router.push(`/user/${item.authorUsername}`)}
            onCommunity={() => router.push(`/community/${item.communitySlug}`)}
            onMenu={() => actions.openPostMenu(item)}
            onSave={() => actions.savePost(item)}
            onPress={() => router.push(`/post/${item.id}`)}
            onReference={(reference) =>
              router.push({
                pathname: '/scripture',
                params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) },
              })
            }
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
