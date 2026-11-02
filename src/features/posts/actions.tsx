import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ReportDialog } from '@/components/ui/ReportDialog';
import { type ModerationAction } from '@/constants/moderationReasons';
import { useAuth } from '@/features/auth/AuthProvider';
import { patchPost, withVote } from '@/features/feed/cache';
import { ModerationSheet } from '@/features/moderation/ModerationSheet';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { membershipNotice } from '@/lib/communityBrowse';
import { nextVote } from '@/lib/domain/votes';
import { queryClient } from '@/lib/queryClient';
import { sharePost } from '@/lib/share';
import { usePending, type PendingAction } from '@/store/pending';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { Comment, PostCard, ReportReason, VoteValue } from '@/types';

interface PendingModeration {
  action: ModerationAction;
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  communityId: string;
}

function moderationToast(action: ModerationAction, targetType: 'post' | 'comment') {
  if (action === 'remove') return targetType === 'post' ? 'Post removed' : 'Comment removed';
  if (action === 'lock') return 'Discussion locked';
  if (action === 'unlock') return 'Discussion unlocked';
  return 'Report dismissed';
}

function signInFirst(returnTo: string, action?: PendingAction) {
  usePending.getState().setPending(returnTo, action ?? null);
  router.push('/(auth)/sign-in');
}

export function useContentActions(returnTo: string) {
  const { session } = useAuth();
  const client = useQueryClient();
  const [menu, setMenu] = useState<{ kind: 'post' | 'comment'; post?: PostCard; comment?: Comment; communityId?: string } | null>(null);
  const [moderation, setModeration] = useState<(PendingModeration & { key: number }) | null>(null);
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
      patchPost(client, post.id, (item) => ({
        ...item,
        score: result.score,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        userVote: result.userVote as VoteValue,
      }));
    },
  });

  const save = useMutation({
    mutationFn: async (post: PostCard) => (await getApi()).setSaved(post.id, !post.saved),
    onMutate: async (post) => {
      const next = !post.saved;
      patchPost(client, post.id, (item) => ({ ...item, saved: next }));
      client.setQueryData<PostCard[]>(['saved'], (list) => {
        if (!list) return list;
        if (!next) return list.filter((item) => item.id !== post.id);
        const updated = { ...post, saved: true };
        return list.some((item) => item.id === post.id) ? list.map((item) => (item.id === post.id ? updated : item)) : [updated, ...list];
      });
    },
    onSuccess: (_result, post) => useToast.getState().show(post.saved ? 'Removed from saved' : 'Saved'),
    onError: (error) => setNotice(error instanceof AppError ? error.message : 'Could not update saved posts.'),
    onSettled: () => void client.invalidateQueries({ queryKey: ['saved'] }),
  });

  const pray = useMutation({
    mutationFn: async (post: PostCard) => (await getApi()).setPrayed(post.id, !post.userPrayed),
    onMutate: async (post) => {
      const next = !post.userPrayed;
      patchPost(client, post.id, (item) => ({
        ...item,
        userPrayed: next,
        prayedCount: Math.max(0, (item.prayedCount ?? 0) + (next ? 1 : -1)),
      }));
    },
    onError: (error, post) => {
      void client.invalidateQueries({ queryKey: ['feed'] });
      void client.invalidateQueries({ queryKey: ['post', post.id] });
      setNotice(error instanceof AppError ? error.message : error instanceof Error ? error.message : 'Could not save that prayer.');
    },
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

  function prayPost(post: PostCard) {
    if (!session) {
      signInFirst(returnTo, { type: 'pray', postId: post.id, prayed: !post.userPrayed });
      return;
    }
    pray.mutate(post);
  }

  const canMod = (communityId: string) => !!capabilities.data && (capabilities.data.isAdmin || capabilities.data.communityIds.includes(communityId));

  function startModeration(next: PendingModeration) {
    setMenu(null);
    setModeration({ ...next, key: Date.now() });
  }

  async function runModeration(reason: string) {
    if (!moderation) return;
    const { communityId, targetType, targetId, postId, action } = moderation;
    try {
      await (await getApi()).moderate({ communityId, targetType, targetId, action, reason });
    } catch (error) {
      setModeration(null);
      setNotice(error instanceof Error ? error.message : 'Something went wrong.');
      return;
    }
    setModeration(null);
    useToast.getState().show(moderationToast(action, targetType));
    await Promise.all([
      client.invalidateQueries({ queryKey: ['comments', postId] }),
      client.invalidateQueries({ queryKey: ['post', postId] }),
      client.invalidateQueries({ queryKey: ['feed'] }),
      client.invalidateQueries({ queryKey: ['community'] }),
      client.invalidateQueries({ queryKey: ['moderation-history'] }),
    ]);
  }

  const dialogs = (
    <>
      <BottomSheet onClose={() => setMenu(null)} visible={!!menu}>
        {menu?.post ? (
          <>
            <MenuItem
              icon="share-outline"
              label="Share"
              onPress={() => {
                const post = menu.post!;
                setMenu(null);
                void sharePost(post);
              }}
            />
            {menu.post.authorId === session?.userId ? (
              <>
                <MenuItem
                  icon="create-outline"
                  label="Edit"
                  onPress={() => {
                    setMenu(null);
                    router.push(`/compose?postId=${menu.post!.id}`);
                  }}
                />
                <MenuItem
                  destructive
                  icon="trash-outline"
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
                  icon="flag-outline"
                  label="Report"
                  onPress={() => {
                    setReport({ targetType: 'post', targetId: menu.post!.id });
                    setMenu(null);
                  }}
                />
                {menu.post.authorId ? (
                  <MenuItem
                    icon="ban-outline"
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
                <MenuSection label="Moderator" />
                <MenuItem
                  icon={menu.post.isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  label={menu.post.isLocked ? 'Unlock discussion' : 'Lock discussion'}
                  onPress={() => {
                    const post = menu.post!;
                    startModeration({
                      action: post.isLocked ? 'unlock' : 'lock',
                      targetType: 'post',
                      targetId: post.id,
                      postId: post.id,
                      communityId: post.communityId,
                    });
                  }}
                />
                {menu.post.status === 'published' ? (
                  <MenuItem
                    destructive
                    icon="trash-outline"
                    label="Remove post"
                    onPress={() => {
                      const post = menu.post!;
                      startModeration({ action: 'remove', targetType: 'post', targetId: post.id, postId: post.id, communityId: post.communityId });
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
        {menu?.comment && menu.comment.authorId === session?.userId ? (
          <MenuItem
            destructive
            icon="trash-outline"
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
                  await client.invalidateQueries({ queryKey: ['post', comment.postId] });
                  await client.invalidateQueries({ queryKey: ['feed'] });
                  await client.invalidateQueries({ queryKey: ['profile-posts'] });
                  await client.invalidateQueries({ queryKey: ['profile-comments'] });
                },
              });
            }}
          />
        ) : null}
        {menu?.comment && menu.comment.authorId !== session?.userId ? (
          <>
            <MenuItem
              icon="flag-outline"
              label="Report comment"
              onPress={() => {
                setReport({ targetType: 'comment', targetId: menu.comment!.id });
                setMenu(null);
              }}
            />
            {menu.comment.authorId ? (
              <MenuItem
                icon="ban-outline"
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
        {menu?.comment && menu.communityId && menu.comment.status === 'published' && menu.comment.authorId !== session?.userId && canMod(menu.communityId) ? (
          <>
            <MenuSection label="Moderator" />
            <MenuItem
              destructive
              icon="trash-outline"
              label="Remove comment"
              onPress={() => {
                const comment = menu.comment!;
                startModeration({ action: 'remove', targetType: 'comment', targetId: comment.id, postId: comment.postId, communityId: menu.communityId! });
              }}
            />
          </>
        ) : null}
      </BottomSheet>
      <ModerationSheet key={moderation?.key ?? 'none'} onClose={() => setModeration(null)} onSubmit={runModeration} request={moderation} />
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
      <ConfirmationDialog
        confirmLabel="OK"
        message={notice ?? ''}
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
        title="Gather"
        visible={!!notice}
      />
    </>
  );

  return {
    votePost,
    savePost,
    prayPost,
    openPostMenu: (post: PostCard) => setMenu({ kind: 'post', post }),
    openCommentMenu: (comment: Comment, communityId?: string) => setMenu({ kind: 'comment', comment, communityId }),
    dialogs,
  };
}

function MenuItem({ label, onPress, icon, destructive }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; destructive?: boolean }) {
  const theme = useTheme();
  const color = destructive ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginHorizontal: -theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: pressed ? theme.colors.highlight : 'transparent',
      })}
    >
      {icon ? <Ionicons color={color} name={icon} size={22} /> : null}
      <Text style={[theme.type.body, { color, fontWeight: destructive ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );
}

function MenuSection({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: theme.spacing.sm, paddingTop: theme.spacing.md }}>
      <Text style={[theme.type.caption, { color: theme.colors.muted, fontWeight: '600', textTransform: 'uppercase' }]}>{label}</Text>
    </View>
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
  } else if (action.type === 'pray') {
    await api.setPrayed(action.postId, action.prayed);
  } else if (action.type === 'join') {
    await api.setMembership(action.communityId, action.join);
    const community = (await api.listCommunities()).find((item) => item.id === action.communityId);
    if (community) useToast.getState().show(membershipNotice(community.name, action.join));
  }
  await queryClient.invalidateQueries();
}
