import { EmptyState } from '@/components/ui/EmptyState';

export function EmptyFeedState({
  filter,
  onExplore,
}: {
  filter: 'popular' | 'new' | 'following';
  onExplore?: () => void;
}) {
  if (filter === 'following') {
    return (
      <EmptyState
        title="Find your people."
        message="Explore communities."
        actionLabel="Explore communities"
        onAction={onExplore}
      />
    );
  }
  return <EmptyState title="Your next great conversation starts here." message="Questions, stories, and ordinary life belong in this feed." />;
}
