import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTabContentPadding } from '@/features/navigation/useTabContentPadding';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { bodyPreview } from '@/lib/domain/feed';
import { formatJoinDate, formatRelativeTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';

export function ProfileBody({ username, isSelf = false }: { username: string; isSelf?: boolean }) {
  const theme = useTheme();
  const tabPadding = useTabContentPadding();
  const [tab, setTab] = useState<'posts' | 'comments'>('posts');
  const actions = useContentActions(`/user/${username}`);
  const profile = useQuery({ queryKey: ['profile', username], queryFn: async () => (await getApi()).getProfile(username) });
  const posts = useQuery({ queryKey: ['profile-posts', username], queryFn: async () => (await getApi()).listProfilePosts(username) });
  const comments = useQuery({ queryKey: ['profile-comments', username], queryFn: async () => (await getApi()).listProfileComments(username) });
  if (profile.isLoading) return <LoadingSkeleton />;
  if (profile.isError) return <EmptyState actionLabel="Try again" message="This profile could not be loaded." onAction={() => void profile.refetch()} title="Something went wrong" />;
  if (!profile.data) return <EmptyState message="This profile is not available." title="Not found" />;
  const person = profile.data;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <UserAvatar name={person.displayName ?? person.username} path={person.avatarPath} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[theme.type.section, { color: theme.colors.text }]}>{person.displayName || person.username}</Text>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>@{person.username}</Text>
          </View>
        </View>
        {person.bio ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{person.bio}</Text> : null}
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
          Joined {formatJoinDate(person.createdAt)} · {person.postCount} {person.postCount === 1 ? 'post' : 'posts'} · {person.commentCount}{' '}
          {person.commentCount === 1 ? 'comment' : 'comments'}
        </Text>
        {isSelf ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingTop: 4 }}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/settings/edit-profile')} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Edit profile</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/settings/communities')} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Joined communities</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/settings/saved')} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Saved posts</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
        <SegmentedFilter onChange={setTab} options={[{ value: 'posts', label: 'Posts' }, { value: 'comments', label: 'Comments' }]} value={tab} />
      </View>
      {tab === 'posts' ? (
        <FlatList
          ListEmptyComponent={<EmptyState message="Posts from this profile will show up here." title="No posts yet" />}
          contentContainerStyle={{ paddingBottom: tabPadding, flexGrow: 1 }}
          data={posts.data ?? []}
          keyExtractor={(item) => item.id}
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
      ) : (
        <FlatList
          ListEmptyComponent={<EmptyState message="Comments from this profile will show up here." title="No comments yet" />}
          contentContainerStyle={{ paddingBottom: tabPadding, flexGrow: 1 }}
          data={comments.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/post/${item.postId}`)}
              style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 4 }}
            >
              <Text numberOfLines={3} style={[theme.type.body, { color: theme.colors.text }]}>
                {bodyPreview(item.body, 160)}
              </Text>
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{formatRelativeTime(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}
      {actions.dialogs}
    </View>
  );
}
