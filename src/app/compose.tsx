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
    usePending.getState().setPending('/');
    router.replace('/(auth)/sign-in');
  }, [ready, session]);
  if (!session) return null;
  return <Composer initialCommunityId={communityId} onClose={() => router.back()} onCreated={(id) => router.replace(`/post/${id}`)} postId={postId} />;
}
