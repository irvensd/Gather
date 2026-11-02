import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { readableCommunityName } from '@/constants/communities';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { formatNotification, groupNotifications, type NotificationGroup } from '@/lib/domain/notifications';
import { formatRelativeTime } from '@/lib/time';
import { usePending } from '@/store/pending';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { AppNotification } from '@/types';

const BADGES: Partial<Record<AppNotification['type'], keyof typeof Ionicons.glyphMap>> = {
  post_reply: 'chatbubble',
  comment_reply: 'arrow-undo',
  mention: 'at',
};

const SYSTEM_ICONS: Partial<Record<AppNotification['type'], keyof typeof Ionicons.glyphMap>> = {
  prayer_milestone: 'hand-left-outline',
  vote_milestone: 'thumbs-up-outline',
  content_removed: 'shield-outline',
  new_report: 'flag-outline',
};

export default function ActivityScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const notifications = useQuery({
    queryKey: ['notifications'],
    enabled: !!session,
    queryFn: async () => (await getApi()).listNotifications(),
  });
  const refresh = notifications.refetch;
  useFocusEffect(
    useCallback(() => {
      if (session) void refresh();
    }, [refresh, session]),
  );
  const sections = useMemo(() => groupNotifications(notifications.data ?? [], new Date()), [notifications.data]);
  const unread = notifications.data?.filter((item) => !item.isRead).length ?? 0;

  function markLocally(ids: readonly string[] | 'all') {
    client.setQueryData<AppNotification[]>(['notifications'], (list) =>
      list?.map((item) => (ids === 'all' || ids.includes(item.id) ? { ...item, isRead: true } : item)),
    );
  }

  const markAll = useMutation({
    mutationFn: async () => (await getApi()).markAllNotificationsRead(),
    onMutate: () => markLocally('all'),
    onSuccess: () => useToast.getState().show('All caught up'),
    onSettled: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function open(group: NotificationGroup) {
    const unreadIds = group.ids.filter((id) => !notifications.data?.find((item) => item.id === id)?.isRead);
    if (unreadIds.length > 0) {
      markLocally(unreadIds);
      void getApi()
        .then((api) => Promise.all(unreadIds.map((id) => api.markNotificationRead(id))))
        .finally(() => void client.invalidateQueries({ queryKey: ['notifications'] }));
    }
    const item = group.lead;
    if (item.type === 'new_report') {
      router.push('/moderation');
      return;
    }
    if (item.type === 'content_removed') {
      router.push('/settings/guidelines');
      return;
    }
    if (item.postAvailable === false || !item.postId) {
      useToast.getState().show('That post is no longer available.');
      return;
    }
    const goesToReply = group.ids.length === 1 && item.commentId && item.type !== 'post_reply';
    router.push(goesToReply ? `/post/${item.postId}/replies/${item.commentId}` : `/post/${item.postId}`);
  }

  function renderRow(group: NotificationGroup) {
    const item = group.lead;
    const unreadRow = !group.isRead;
    const headline = formatNotification({
      type: item.type,
      actorUsername: item.actorUsername,
      postType: item.postType,
      count: item.count,
      communityName: item.communityName ? readableCommunityName(item.communityName) : null,
      otherActors: group.otherActors,
      aboutComment: !!item.commentId,
    });
    const systemIcon = SYSTEM_ICONS[item.type];
    const badge = BADGES[item.type];
    const quotesPerson = item.type === 'post_reply' || item.type === 'comment_reply' || item.type === 'mention';
    const meta = [item.communityName ? readableCommunityName(item.communityName) : null, formatRelativeTime(item.createdAt)].filter(Boolean).join(' · ');
    return (
      <Pressable
        accessibilityHint={item.type === 'content_removed' ? 'Opens the community guidelines' : undefined}
        accessibilityLabel={`${unreadRow ? 'Unread. ' : ''}${headline} ${item.postTitle ?? ''}. ${meta}`}
        accessibilityRole="button"
        onPress={() => open(group)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingLeft: theme.spacing.sm,
          paddingRight: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.border : unreadRow ? theme.colors.highlight : 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        })}
      >
        <View style={{ width: 8, alignItems: 'center', paddingTop: 18 }}>
          {unreadRow ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} /> : null}
        </View>
        <View>
          {systemIcon ? (
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
              <Ionicons color={item.type === 'content_removed' ? theme.colors.danger : theme.colors.primary} name={systemIcon} size={22} />
            </View>
          ) : (
            <UserAvatar name={item.actorDisplayName ?? item.actorUsername} path={item.actorAvatarPath ?? null} size={44} />
          )}
          {badge ? (
            <View
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
                borderWidth: 2,
                borderColor: unreadRow ? theme.colors.highlight : theme.colors.background,
              }}
            >
              <Ionicons color={theme.colors.onPrimary} name={badge} size={11} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: unreadRow ? '700' : '500' }]}>{headline}</Text>
          {item.postTitle ? (
            <Text numberOfLines={2} style={[theme.type.body, { color: theme.colors.text }]}>
              {item.postAvailable === false && item.type !== 'content_removed' && item.type !== 'new_report' ? 'This post is no longer available.' : item.postTitle}
            </Text>
          ) : null}
          {item.snippet ? (
            <Text numberOfLines={2} style={[theme.type.body, { color: theme.colors.muted }]}>
              {quotesPerson ? `“${item.snippet}”` : `Reason: ${item.snippet}`}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.communityIcon ? <CommunityAvatar color={item.communityColor} icon={item.communityIcon} size={18} /> : null}
            <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.muted, flexShrink: 1 }]}>
              {meta}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        right={
          session && unread > 0 ? (
            <Pressable
              accessibilityLabel={`Mark all ${unread} as read`}
              accessibilityRole="button"
              disabled={markAll.isPending}
              onPress={() => markAll.mutate()}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
            >
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
        title="Activity"
      />
      {!session ? (
        <EmptyState
          actionLabel="Sign in"
          icon="notifications-outline"
          message="When someone replies to you, mentions you, or prays for your request, it shows up here."
          onAction={() => {
            usePending.getState().setPending('/activity');
            router.push('/(auth)/sign-in');
          }}
          title="Sign in to see activity"
        />
      ) : null}
      {session && notifications.isLoading ? <LoadingSkeleton /> : null}
      {session && notifications.isError && !notifications.data ? (
        <EmptyState actionLabel="Try again" icon="cloud-offline-outline" message="Your activity did not load." onAction={() => void refresh()} title="Something went wrong" />
      ) : null}
      {session && notifications.data ? (
        <SectionList
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              message="Replies, mentions, and prayers for your posts will show up here."
              title="You’re all caught up"
            />
          }
          contentContainerStyle={{ paddingBottom: 120, flexGrow: sections.length === 0 ? 1 : undefined }}
          keyExtractor={(group) => group.key}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void refresh().finally(() => setRefreshing(false));
              }}
              refreshing={refreshing}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => renderRow(item)}
          renderSectionHeader={({ section }) => (
            <Text
              accessibilityRole="header"
              style={[
                theme.type.section,
                { color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.background },
              ]}
            >
              {section.title}
            </Text>
          )}
          sections={sections}
          stickySectionHeadersEnabled={false}
        />
      ) : null}
    </ScreenContainer>
  );
}
