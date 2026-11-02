import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { Composer } from '@/features/posts/Composer';
import { usePending } from '@/store/pending';

export default function ComposeScreen() {
  const { communityId, postId } = useLocalSearchParams<{ communityId?: string; postId?: string }>();
  const { session, ready } = useAuth();
  useEffect(() => {
    if (!ready || session) return;
    usePending.getState().setPending(postId ? `/compose?postId=${postId}` : communityId ? `/compose?communityId=${communityId}` : '/compose');
    router.replace('/(auth)/sign-in');
  }, [ready, session, communityId, postId]);
  if (!session) return null;
  return (
    <Composer
      initialCommunityId={communityId}
      onClose={() => router.back()}
      onCreated={(id) => {
        router.back();
        if (!postId) router.push(`/post/${id}`);
      }}
      postId={postId}
    />
  );
}
