import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text } from 'react-native';

import { NotificationRow } from '@/components/activity/NotificationRow';
import { AppHeader } from '@/components/ui/AppHeader';
import { formatSabbathTime, sabbathPlaceById, sabbathWindow } from '@/lib/sabbath';
import { usePreferences } from '@/store/preferences';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTabContentPadding } from '@/features/navigation/useTabContentPadding';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function ActivityScreen() {
  const theme = useTheme();
  const tabPadding = useTabContentPadding();
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
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  const markAll = useMutation({
    mutationFn: async () => (await getApi()).markAllNotificationsRead(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const unread = notifications.data?.some((item) => !item.isRead) ?? false;

  return (
    <ScreenContainer>
      <AppHeader
        right={
          session && unread ? (
            <Pressable accessibilityRole="button" disabled={markAll.isPending} onPress={() => markAll.mutate()} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Mark all read</Text>
            </Pressable>
          ) : null
        }
        title="Activity"
      />
      {quiet?.resting ? (
        <Text style={[theme.type.caption, { color: theme.colors.secondary, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}>
          Notifications would rest until {formatSabbathTime(quiet.end, place.timeZone)}.
        </Text>
      ) : null}
      {!session ? (
        <EmptyState
          actionLabel="Sign in"
          message="Replies and mentions show up here."
          onAction={() => router.push('/(auth)/sign-in')}
          title="Sign in to see activity"
        />
      ) : null}
      {session && notifications.isLoading ? <LoadingSkeleton /> : null}
      {session && notifications.isError ? (
        <EmptyState actionLabel="Try again" message="Activity could not be loaded." onAction={() => void notifications.refetch()} title="Something went wrong" />
      ) : null}
      {session && !notifications.isLoading && !notifications.isError ? (
        <FlatList
          ListEmptyComponent={<EmptyState message="Replies and mentions will show up here." title="You’re all caught up." />}
          contentContainerStyle={{ paddingBottom: tabPadding, flexGrow: 1 }}
          data={notifications.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => {
                void getApi().then((api) => api.markNotificationRead(item.id).then(() => client.invalidateQueries({ queryKey: ['notifications'] })));
                if (item.postId) router.push(item.commentId ? `/post/${item.postId}/replies/${item.commentId}` : `/post/${item.postId}`);
              }}
            />
          )}
        />
      ) : null}
    </ScreenContainer>
  );
}
