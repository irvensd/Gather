import { Share } from 'react-native';

export async function sharePost(post: { title: string; body: string }) {
  const preview = post.body.trim().replace(/\s+/g, ' ').slice(0, 180);
  const message = preview ? `${post.title}\n\n${preview}` : post.title;
  await Share.share({ message });
}
