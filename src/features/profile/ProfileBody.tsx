import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { readableCommunityName } from '@/constants/communities';
import { useAuth } from '@/features/auth/AuthProvider';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { bodyPreview } from '@/lib/domain/feed';
import { formatFriendlyTime, formatJoinDate } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import type { Comment, PostCard as PostCardModel } from '@/types';

type Tab = 'posts' | 'comments' | 'saved';
type Row = { kind: 'post'; post: PostCardModel } | { kind: 'comment'; comment: Comment };

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

export function ProfileBody({ username }: { username: string }) {
  const theme = useTheme();
  const { profile: me } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const isOwn = !!me && me.username.toLowerCase() === username.toLowerCase();
  const actions = useContentActions(`/user/${username}`);
  const profile = useQuery({ queryKey: ['profile', username], queryFn: async () => (await getApi()).getProfile(username) });
  const posts = useQuery({ queryKey: ['profile-posts', username], queryFn: async () => (await getApi()).listProfilePosts(username) });
  const comments = useQuery({ queryKey: ['profile-comments', username], queryFn: async () => (await getApi()).listProfileComments(username) });
  const reloadProfile = profile.refetch;
  const reloadPosts = posts.refetch;
  const reloadComments = comments.refetch;
  useFocusEffect(
    useCallback(() => {
      void reloadProfile();
      void reloadPosts();
      void reloadComments();
    }, [reloadComments, reloadPosts, reloadProfile]),
  );
  const saved = useQuery({ queryKey: ['saved'], enabled: isOwn, queryFn: async () => (await getApi()).listSavedPosts() });
  const capabilities = useQuery({
    queryKey: ['capabilities'],
    enabled: isOwn,
    queryFn: async () => (await getApi()).getCapabilities(),
  });
  if (profile.isLoading) return <LoadingSkeleton />;
  if (!profile.data) return <EmptyState icon="person-outline" message="This profile is not available." title="Not found" />;
  const person = profile.data;
  const name = person.displayName || person.username;
  const canModerate = isOwn && !!capabilities.data && (capabilities.data.isAdmin || capabilities.data.communityIds.length > 0);
  const active = tab === 'posts' ? posts : tab === 'saved' ? saved : comments;
  const rows: Row[] =
    tab === 'comments'
      ? (comments.data ?? []).map((comment) => ({ kind: 'comment', comment }))
      : ((tab === 'saved' ? saved.data : posts.data) ?? []).map((post) => ({ kind: 'post', post }));

  const actionButton = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pressed ? theme.colors.highlight : theme.colors.surface,
      })}
    >
      <Ionicons color={theme.colors.text} name={icon} size={18} />
      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );

  const header = (
    <View>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
          <UserAvatar name={name} path={person.avatarPath} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text accessibilityRole="header" numberOfLines={2} style={[theme.type.title, { color: theme.colors.text, fontSize: 24, lineHeight: 30, fontWeight: '700' }]}>
              {name}
            </Text>
            <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted }]}>
              @{person.username}
            </Text>
          </View>
        </View>
        {person.bio ? (
          <Text style={[theme.type.body, { color: theme.colors.text }]}>{person.bio}</Text>
        ) : isOwn ? (
          <Text onPress={() => router.push('/settings/edit-profile')} style={[theme.type.body, { color: theme.colors.primary }]}>
            Add a short bio so people know who they are talking with.
          </Text>
        ) : null}
        <Text style={[theme.type.body, { color: theme.colors.muted }]}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{person.postCount}</Text> {plural(person.postCount, 'post', 'posts')}
          {'   '}
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{person.commentCount}</Text> {plural(person.commentCount, 'comment', 'comments')}
          {'   '}Joined {formatJoinDate(person.createdAt)}
        </Text>
        {isOwn ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {actionButton('Edit profile', 'create-outline', () => router.push('/settings/edit-profile'))}
            {canModerate ? actionButton('Moderation', 'shield-checkmark-outline', () => router.push('/moderation')) : null}
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <SegmentedFilter
          onChange={setTab}
          options={[
            { value: 'posts', label: 'Posts' },
            { value: 'comments', label: 'Comments' },
            ...(isOwn ? [{ value: 'saved' as const, label: 'Saved' }] : []),
          ]}
          value={tab}
        />
      </View>
    </View>
  );

  const empty = active.isLoading ? (
    <LoadingSkeleton />
  ) : tab === 'posts' ? (
    isOwn ? (
      <EmptyState
        actionLabel="Write a post"
        icon="create-outline"
        message="Ask a question or share something with a community."
        onAction={() => router.push('/compose')}
        title="You haven’t posted yet"
      />
    ) : (
      <EmptyState icon="document-text-outline" message={`When ${name} posts, it will show up here.`} title="No posts yet" />
    )
  ) : tab === 'saved' ? (
    <EmptyState icon="bookmark-outline" message="Tap the bookmark on a post to keep it here." title="Nothing saved yet" />
  ) : (
    <EmptyState
      icon="chatbubbles-outline"
      message={isOwn ? 'Your replies to other people’s posts will show up here.' : `When ${name} replies to a post, it will show up here.`}
      title="No comments yet"
    />
  );

  function renderComment(comment: Comment) {
    const community = comment.communityName ? readableCommunityName(comment.communityName) : null;
    return (
      <Pressable
        accessibilityHint="Opens the conversation"
        accessibilityRole="button"
        onPress={() => router.push(`/post/${comment.postId}`)}
        style={({ pressed }) => ({
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: 6,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.highlight : 'transparent',
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons color={theme.colors.muted} name="arrow-undo-outline" size={16} />
          <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted, flex: 1 }]}>
            {community ? (
              <>
                Replied in <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{community}</Text>
              </>
            ) : (
              'Replied'
            )}
          </Text>
        </View>
        <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
          {comment.postTitle ?? 'A post that is no longer available'}
        </Text>
        <Text numberOfLines={3} style={[theme.type.body, { color: theme.colors.text }]}>
          {bodyPreview(comment.body, 220)}
        </Text>
        <View
          accessibilityLabel={`${comment.upvotes} likes, ${comment.downvotes} dislikes, ${formatFriendlyTime(comment.createdAt)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons color={theme.colors.muted} name="thumbs-up-outline" size={16} />
          <Text style={[theme.type.caption, { color: theme.colors.muted }]}>{comment.upvotes ?? 0}</Text>
          <Ionicons color={theme.colors.muted} name="thumbs-down-outline" size={16} />
          <Text style={[theme.type.caption, { color: theme.colors.muted }]}>
            {comment.downvotes ?? 0} · {formatFriendlyTime(comment.createdAt)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ListEmptyComponent={empty}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 120 }}
        data={rows}
        keyExtractor={(row) => (row.kind === 'post' ? `post-${row.post.id}` : `comment-${row.comment.id}`)}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshing(true);
              void Promise.all([profile.refetch(), posts.refetch(), comments.refetch(), isOwn ? saved.refetch() : null]).finally(() => setRefreshing(false));
            }}
            refreshing={refreshing}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item: row }) =>
          row.kind === 'comment' ? (
            renderComment(row.comment)
          ) : (
            <PostCard
              onAuthor={() => undefined}
              onCommunity={() => router.push(`/community/${row.post.communitySlug}`)}
              onMenu={() => actions.openPostMenu(row.post)}
              onSave={() => actions.savePost(row.post)}
              onPress={() => router.push(`/post/${row.post.id}`)}
              onPray={() => actions.prayPost(row.post)}
              onReference={(reference) =>
                router.push({
                  pathname: '/scripture',
                  params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) },
                })
              }
              onVote={(value) => actions.votePost(row.post, value)}
              post={row.post}
              showAuthor={tab === 'saved'}
            />
          )
        }
      />
      {actions.dialogs}
    </View>
  );
}
