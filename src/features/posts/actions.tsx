import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ReportDialog } from '@/components/ui/ReportDialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { patchPost, withVote } from '@/features/feed/cache';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { nextVote } from '@/lib/domain/votes';
import { queryClient } from '@/lib/queryClient';
import { usePending, type PendingAction } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';
import type { Comment, PostCard, ReportReason, VoteValue } from '@/types';

function signInFirst(returnTo: string, action?: PendingAction) {
  usePending.getState().setPending(returnTo, action ?? null);
  router.push('/(auth)/sign-in');
}

export function useContentActions(returnTo: string) {
  const { session } = useAuth();
  const client = useQueryClient();
  const [menu, setMenu] = useState<{ kind: 'post' | 'comment'; post?: PostCard; comment?: Comment } | null>(null);
  const [report, setReport] = useState<{ targetType: 'post' | 'comment'; targetId: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; run: () => Promise<void> } | null>(null);
  const capabilities = useQuery({
    queryKey: ['capabilities'],
    enabled: !!session,
    queryFn: async () => (await getApi()).getCapabilities(),
  });

  const vote = useMutation({
    mutationFn: async ({ post, direction }: { post: PostCard; direction: -1 | 1 }) => {
      const next = nextVote(post.userVote, direction);
      return { next, result: await (await getApi()).votePost(post.id, next) };
    },
    onMutate: async ({ post, direction }) => {
      const next = nextVote(post.userVote, direction);
      await client.cancelQueries({ queryKey: ['feed'] });
      const previous = client.getQueriesData({ queryKey: ['feed'] });
      const previousPost = client.getQueryData<PostCard>(['post', post.id]);
      patchPost(client, post.id, (item) => withVote(item, next));
      return { previous, previousPost, postId: post.id };
    },
    onError: (error, _vars, context) => {
      context?.previous.forEach(([key, data]) => client.setQueryData(key, data));
      if (context) client.setQueryData(['post', context.postId], context.previousPost);
      setNotice(error instanceof AppError ? error.message : 'Could not save your vote.');
    },
    onSuccess: ({ result }, { post }) => {
      patchPost(client, post.id, (item) => ({ ...item, score: result.score, userVote: result.userVote as VoteValue }));
    },
  });

  const save = useMutation({
    mutationFn: async (post: PostCard) => (await getApi()).setSaved(post.id, !post.saved),
    onMutate: async (post) => {
      patchPost(client, post.id, (item) => ({ ...item, saved: !item.saved }));
    },
    onError: (error) => setNotice(error instanceof AppError ? error.message : 'Could not update saved posts.'),
    onSettled: () => void client.invalidateQueries({ queryKey: ['saved'] }),
  });

  function votePost(post: PostCard, direction: -1 | 1) {
    if (!session) {
      signInFirst(returnTo, { type: 'vote', postId: post.id, value: direction });
      return;
    }
    vote.mutate({ post, direction });
  }

  function savePost(post: PostCard) {
    if (!session) {
      signInFirst(returnTo, { type: 'save', postId: post.id, saved: !post.saved });
      return;
    }
    save.mutate(post);
  }

  const canMod = (communityId: string) =>
    !!capabilities.data && (capabilities.data.isAdmin || capabilities.data.communityIds.includes(communityId));

  function moderatePost(post: PostCard, action: 'remove' | 'lock' | 'unlock') {
    setMenu(null);
    setConfirm({
      title: action === 'remove' ? 'Remove this post?' : action === 'lock' ? 'Lock this discussion?' : 'Unlock this discussion?',
      message: 'This is recorded in the moderation history.',
      confirmLabel: 'Continue',
      run: async () => {
        await (await getApi()).moderate({
          communityId: post.communityId,
          targetType: 'post',
          targetId: post.id,
          action,
          reason: 'Moderator review',
        });
        await client.invalidateQueries();
      },
    });
  }

  const dialogs = (
    <>
      <BottomSheet onClose={() => setMenu(null)} visible={!!menu}>
        {menu?.post ? (
          <>
            <MenuItem label="Open discussion" onPress={() => { setMenu(null); router.push(`/post/${menu.post!.id}`); }} />
            {menu.post.authorId === session?.userId ? (
              <>
                <MenuItem label="Edit" onPress={() => { setMenu(null); router.push(`/compose?postId=${menu.post!.id}`); }} />
                <MenuItem
                  label="Delete"
                  onPress={() => {
                    const post = menu.post!;
                    setMenu(null);
                    setConfirm({
                      title: 'Delete this post?',
                      message: 'The discussion will stay in place without the original text.',
                      confirmLabel: 'Delete post',
                      run: async () => {
                        await (await getApi()).deletePost(post.id);
                        await client.invalidateQueries({ queryKey: ['feed'] });
                      },
                    });
                  }}
                />
              </>
            ) : (
              <>
                <MenuItem
                  label="Report"
                  onPress={() => {
                    setReport({ targetType: 'post', targetId: menu.post!.id });
                    setMenu(null);
                  }}
                />
                {menu.post.authorId ? (
                  <MenuItem
                    label="Block author"
                    onPress={() => {
                      const authorId = menu.post!.authorId!;
                      setMenu(null);
                      if (!session) {
                        signInFirst(returnTo);
                        return;
                      }
                      setConfirm({
                        title: 'Block this person?',
                        message: 'You will stop seeing each other’s posts, comments, and notifications.',
                        confirmLabel: 'Block',
                        run: async () => {
                          await (await getApi()).setBlocked(authorId, true);
                          await client.invalidateQueries();
                        },
                      });
                    }}
                  />
                ) : null}
              </>
            )}
            {canMod(menu.post.communityId) ? (
              <>
                <MenuItem label={menu.post.isLocked ? 'Unlock discussion' : 'Lock discussion'} onPress={() => moderatePost(menu.post!, menu.post!.isLocked ? 'unlock' : 'lock')} />
                <MenuItem label="Remove post" onPress={() => moderatePost(menu.post!, 'remove')} />
              </>
            ) : null}
          </>
        ) : null}
        {menu?.comment && menu.comment.authorId === session?.userId ? (
          <MenuItem
            label="Delete comment"
            onPress={() => {
              const comment = menu.comment!;
              setMenu(null);
              setConfirm({
                title: 'Delete this comment?',
                message: 'Replies stay attached, without the original text.',
                confirmLabel: 'Delete comment',
                run: async () => {
                  await (await getApi()).deleteComment(comment.id);
                  await client.invalidateQueries({ queryKey: ['comments', comment.postId] });
                },
              });
            }}
          />
        ) : null}
        {menu?.comment && menu.comment.authorId !== session?.userId ? (
          <>
            <MenuItem
              label="Report comment"
              onPress={() => {
                setReport({ targetType: 'comment', targetId: menu.comment!.id });
                setMenu(null);
              }}
            />
            {menu.comment.authorId ? (
              <MenuItem
                label="Block author"
                onPress={() => {
                  const authorId = menu.comment!.authorId!;
                  setMenu(null);
                  if (!session) return signInFirst(returnTo);
                  setConfirm({
                    title: 'Block this person?',
                    message: 'You will stop seeing each other’s posts, comments, and notifications.',
                    confirmLabel: 'Block',
                    run: async () => {
                      await (await getApi()).setBlocked(authorId, true);
                      await client.invalidateQueries();
                    },
                  });
                }}
              />
            ) : null}
          </>
        ) : null}
      </BottomSheet>
      <ReportDialog
        onClose={() => setReport(null)}
        onSubmit={async (reason: ReportReason, details: string) => {
          if (!session) {
            setReport(null);
            signInFirst(returnTo);
            return;
          }
          if (!report) return;
          await (await getApi()).report({ ...report, reason, details });
          setReport(null);
          setNotice('Report submitted. Moderators can review it.');
        }}
        visible={!!report}
      />
      <ConfirmationDialog
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        message={confirm?.message ?? ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const current = confirm;
          setConfirm(null);
          if (current) void current.run().catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'Something went wrong.'));
        }}
        title={confirm?.title ?? ''}
        visible={!!confirm}
      />
      <ConfirmationDialog confirmLabel="OK" message={notice ?? ''} onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} title="Gather" visible={!!notice} />
    </>
  );

  return {
    votePost,
    savePost,
    openPostMenu: (post: PostCard) => setMenu({ kind: 'post', post }),
    openCommentMenu: (comment: Comment) => setMenu({ kind: 'comment', comment }),
    dialogs,
  };
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 48, justifyContent: 'center' }}>
      <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export async function resumePendingAction() {
  const pending = usePending.getState();
  const action = pending.action;
  if (!action) return;
  usePending.getState().clearPending();
  const api = await getApi();
  if (action.type === 'vote') {
    const post = await api.getPost(action.postId);
    const next = nextVote(post.userVote, action.value);
    await api.votePost(action.postId, next);
  } else if (action.type === 'save') {
    await api.setSaved(action.postId, action.saved);
  } else if (action.type === 'join') {
    await api.setMembership(action.communityId, action.join);
  }
  await queryClient.invalidateQueries();
}
