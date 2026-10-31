import { useLocalSearchParams } from 'expo-router';

import { Discussion } from '@/features/posts/Discussion';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Discussion postId={id} />;
}
