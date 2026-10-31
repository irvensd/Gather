import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { formatSabbathTime, sabbathPlaceById, sabbathWindow } from '@/lib/sabbath';
import { usePreferences } from '@/store/preferences';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { formatNotification } from '@/lib/domain/notifications';
import { formatRelativeTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';

export default function ActivityScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const sabbathQuiet = usePreferences((state) => state.sabbathQuiet);
  const sabbathPlaceId = usePreferences((state) => state.sabbathPlaceId);
  const place = sabbathPlaceById(sabbathPlaceId);
  const quiet = sabbathQuiet ? sabbathWindow(new Date(), place) : null;
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications'],
    enabled: !!session,
    queryFn: async () => (await getApi()).listNotifications(),
  });
  const refresh = notifications.refetch;
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const markAll = useMutation({
    mutationFn: async () => (await getApi()).markAllNotificationsRead(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return (
    <ScreenContainer>
      <AppHeader right={<Pressable onPress={() => session && markAll.mutate()}><Text style={[theme.type.caption, { color: theme.colors.primary }]}>Mark all read</Text></Pressable>} title="Activity" />
      {quiet?.resting ? (
        <Text style={[theme.type.caption, { color: theme.colors.secondary, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}>
          Notifications would rest until {formatSabbathTime(quiet.end, place.timeZone)}.
        </Text>
      ) : null}
      {!session ? <EmptyState actionLabel="Sign in" message="Replies and mentions show up here." onAction={() => router.push('/(auth)/sign-in')} title="Sign in to see activity" /> : null}
      {session && notifications.isLoading ? <LoadingSkeleton /> : null}
      {session ? (
        <FlatList
          ListEmptyComponent={<EmptyState message="Replies and mentions will show up here." title="You’re all caught up." />}
          contentContainerStyle={{ paddingBottom: 120 }}
          data={notifications.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                void getApi().then((api) => api.markNotificationRead(item.id).then(() => client.invalidateQueries({ queryKey: ['notifications'] })));
                if (item.postId) router.push(item.commentId ? `/post/${item.postId}/replies/${item.commentId}` : `/post/${item.postId}`);
              }}
              style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 4 }}
            >
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: item.isRead ? '400' : '600' }]}>
                {formatNotification({ type: item.type, actorUsername: item.actorUsername, postType: item.postType })}
              </Text>
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{formatRelativeTime(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      ) : null}
    </ScreenContainer>
  );
}
