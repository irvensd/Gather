import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePending } from '@/store/pending';

export function EmptyFeedState({ filter, onExplore }: { filter: 'popular' | 'new' | 'following'; onExplore?: () => void }) {
  const { session } = useAuth();
  if (filter === 'following' && !session) {
    return (
      <EmptyState
        actionLabel="Sign in"
        icon="people-outline"
        message="Join communities, and their newest conversations show up here."
        onAction={() => {
          usePending.getState().setPending('/');
          router.push('/(auth)/sign-in');
        }}
        title="Sign in to see communities you follow"
      />
    );
  }
  if (filter === 'following') {
    return (
      <EmptyState
        actionLabel="Explore communities"
        icon="compass-outline"
        message="Join a community and its newest conversations show up here."
        onAction={onExplore}
        title="Nothing here yet."
      />
    );
  }
  return (
    <EmptyState
      icon="chatbubbles-outline"
      message="You can read every conversation without an account. Sign in when you want to reply, vote, or post."
      title="No conversations yet"
    />
  );
}
