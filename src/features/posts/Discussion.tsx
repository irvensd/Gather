import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentCard } from '@/components/comments/CommentCard';
import { PrayedButton } from '@/components/feed/PrayedButton';
import { RichText } from '@/components/scripture/RichText';
import { ScriptureReferenceList } from '@/components/scripture/ScriptureReference';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SaveButton } from '@/components/ui/SaveButton';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { VoteControl } from '@/components/ui/VoteControl';
import { readableCommunityName } from '@/constants/communities';
import { postByline } from '@/constants/postTypes';
import { useAuth } from '@/features/auth/AuthProvider';
import { useContentActions } from '@/features/posts/actions';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { buildCommentForest, flattenForDisplay, sortCommentForest, subtree } from '@/lib/domain/comments';
import { mergeReferences } from '@/lib/scripture/parse';
import { sharePost } from '@/lib/share';
import { formatFriendlyTime } from '@/lib/time';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';
import type { CommentSort, ScriptureReference } from '@/types';

export function Discussion({ postId, focusCommentId }: { postId: string; focusCommentId?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const client = useQueryClient();
  const actions = useContentActions(`/post/${postId}`);
  const [sort, setSort] = useState<CommentSort>('helpful');
  const [body, setBody] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(focusCommentId ?? null);
  const [error, setError] = useState<string | null>(null);
  const post = useQuery({ queryKey: ['post', postId], queryFn: async () => (await getApi()).getPost(postId) });
  const comments = useQuery({ queryKey: ['comments', postId], queryFn: async () => (await getApi()).getComments(postId) });
  const rows = useMemo(() => {
    const source = focusCommentId ? subtree(comments.data ?? [], focusCommentId) : (comments.data ?? []);
    return flattenForDisplay(sortCommentForest(buildCommentForest(source), sort));
  }, [comments.data, focusCommentId, sort]);

  const create = useMutation({
    mutationFn: async () => {
      const references: ScriptureReference[] = mergeReferences([], body);
      return (await getApi()).createComment({ postId, parentCommentId: replyToId, body, scriptureReferences: references });
    },
    onSuccess: async () => {
      setBody('');
      setReplyToId(focusCommentId ?? null);
      await client.invalidateQueries({ queryKey: ['comments', postId] });
      await client.invalidateQueries({ queryKey: ['post', postId] });
      await client.invalidateQueries({ queryKey: ['feed'] });
      await client.invalidateQueries({ queryKey: ['profile-posts'] });
      await client.invalidateQueries({ queryKey: ['profile-comments'] });
      await client.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (caught) => setError(caught instanceof AppError ? caught.message : 'Could not post the comment.'),
  });

  function openReference(reference: ScriptureReference) {
    router.push({
      pathname: '/scripture',
      params: { book: reference.book, chapter: String(reference.chapter), start: String(reference.verseStart), end: String(reference.verseEnd) },
    });
  }

  if (post.isLoading || comments.isLoading) return <LoadingSkeleton />;
  if (post.isError || !post.data) return <EmptyState message="It may have been removed." title="This discussion is unavailable." />;
  const item = post.data;
  const locked = item.isLocked || item.status !== 'published';
  const replyTarget = (comments.data ?? []).find((comment) => comment.id === replyToId) ?? null;
  const parents = new Map((comments.data ?? []).map((comment) => [comment.id, comment]));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <Text numberOfLines={1} style={[theme.type.section, { flex: 1, color: theme.colors.text }]}>
          {readableCommunityName(item.communityName)}
        </Text>
        <IconButton color={theme.colors.secondary} label="Share" name="share-outline" onPress={() => void sharePost(item)} />
        <IconButton color={theme.colors.secondary} label="More actions" name="ellipsis-horizontal" onPress={() => actions.openPostMenu(item)} />
      </View>
      <FlatList
        ListHeaderComponent={
          <View style={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.md }}>
            <Text style={[theme.type.body, { color: theme.colors.text }]}>
              {postByline(item.type, item.authorDisplayName || item.authorUsername || 'Deleted user')} · {formatFriendlyTime(item.createdAt)}
            </Text>
            <Text style={[theme.type.postTitle, { color: theme.colors.text }]}>{item.title}</Text>
            {item.status === 'published' ? (
              <RichText onReference={openReference} text={item.body} />
            ) : (
              <Text style={[theme.type.body, { color: theme.colors.secondary }]}>This post was removed.</Text>
            )}
            {item.imageUri ? (
              <Image
                accessibilityLabel="Post photo"
                contentFit="cover"
                source={{ uri: item.imageUri }}
                style={{ width: '100%', height: 240, borderRadius: theme.radius.md, backgroundColor: theme.colors.highlight }}
              />
            ) : null}
            <ScriptureReferenceList onPress={openReference} references={item.scriptureReferences} />
            {item.type === 'prayer_request' && item.status === 'published' ? (
              <PrayedButton count={item.prayedCount ?? 0} onPress={() => actions.prayPost(item)} prayed={!!item.userPrayed} />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <VoteControl
                disabled={locked}
                downvotes={item.downvotes ?? 0}
                labeled
                onVote={(value) => actions.votePost(item, value)}
                upvotes={item.upvotes ?? 0}
                value={item.userVote}
              />
              {session && item.authorId === session.userId ? null : (
                <View style={{ marginLeft: 'auto' }}>
                  <SaveButton onPress={() => actions.savePost(item)} saved={item.saved} />
                </View>
              )}
            </View>
            {item.isLocked ? <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>This discussion is locked.</Text> : null}
            <SegmentedFilter
              onChange={setSort}
              options={[
                { value: 'helpful', label: 'Top' },
                { value: 'newest', label: 'Newest' },
              ]}
              value={sort}
            />
            {rows.length === 0 ? <Text style={[theme.type.body, { color: theme.colors.secondary }]}>Be the first to join the discussion.</Text> : null}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: theme.spacing.lg }}
        data={rows}
        keyExtractor={(row) => row.comment.id}
        renderItem={({ item: row }) => (
          <CommentCard
            comment={row.comment}
            depth={row.depth}
            hiddenReplyCount={row.hiddenReplyCount}
            onAuthor={() => row.comment.authorUsername && router.push(`/user/${row.comment.authorUsername}`)}
            onMenu={() => actions.openCommentMenu(row.comment, item.communityId)}
            onReference={openReference}
            onReply={session ? () => setReplyToId(row.comment.id) : undefined}
            replyingTo={row.comment.parentCommentId ? parents.get(row.comment.parentCommentId)?.authorUsername : null}
            onViewReplies={() => router.push(`/post/${postId}/replies/${row.comment.id}`)}
            onVote={(value) => {
              if (!session) {
                usePending.getState().setPending(`/post/${postId}`);
                router.push('/(auth)/sign-in');
                return;
              }
              const next = row.comment.userVote === value ? 0 : value;
              void getApi().then((api) => api.voteComment(row.comment.id, next).then(() => client.invalidateQueries({ queryKey: ['comments', postId] })));
            }}
          />
        )}
      />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom + 8,
          gap: 8,
        }}
      >
        {session && replyTarget ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Replying to @{replyTarget.authorUsername ?? 'someone'}</Text>
            {focusCommentId ? null : (
              <Text onPress={() => setReplyToId(null)} style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                Cancel
              </Text>
            )}
          </View>
        ) : null}
        {session && error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{error}</Text> : null}
        {session ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput
              editable={!locked}
              multiline
              onChangeText={setBody}
              placeholder={locked ? 'Comments are closed' : replyTarget ? `Reply to @${replyTarget.authorUsername ?? 'someone'}` : 'Join the discussion'}
              placeholderTextColor={theme.colors.secondary}
              style={[theme.type.body, { flex: 1, color: theme.colors.text, maxHeight: 120, paddingVertical: 8 }]}
              testID="comment-input"
              value={body}
            />
            <Pressable
              accessibilityRole="button"
              disabled={locked || !body.trim() || create.isPending}
              onPress={() => {
                if (locked || !body.trim()) return;
                if (!session) {
                  usePending.getState().setPending(`/post/${postId}`);
                  router.push('/(auth)/sign-in');
                  return;
                }
                create.mutate();
              }}
              style={{
                minHeight: 36,
                paddingHorizontal: 14,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
                opacity: locked || !body.trim() || create.isPending ? 0.4 : 1,
              }}
              testID="comment-submit"
            >
              <Text style={[theme.type.caption, { color: theme.colors.onPrimary, fontWeight: '600' }]}>{create.isPending ? 'Sending…' : 'Send'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {actions.dialogs}
    </KeyboardAvoidingView>
  );
}
