import { useLocalSearchParams } from 'expo-router';

import { Discussion } from '@/features/posts/Discussion';

export default function RepliesScreen() {
  const { id, commentId } = useLocalSearchParams<{ id: string; commentId: string }>();
  return <Discussion focusCommentId={commentId} postId={id} />;
}
