import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const theme = useTheme();
  const { session } = useAuth();
  const notifications = useQuery({
    queryKey: ['notifications'],
    enabled: !!session,
    queryFn: async () => (await getApi()).listNotifications(),
  });
  const unread = notifications.data?.filter((item) => !item.isRead).length ?? 0;

  function openComposer() {
    if (!session) {
      usePending.getState().setPending('/compose');
      router.push('/(auth)/sign-in');
      return;
    }
    router.push('/compose');
  }

  return (
    <NativeTabs
      activityEnabled
      backgroundColor={theme.colors.background}
      iconColor={{ default: theme.colors.secondary, selected: theme.colors.primary }}
      indicatorColor={theme.colors.highlight}
      labelStyle={{ default: { color: theme.colors.secondary }, selected: { color: theme.colors.primary } }}
      tintColor={theme.colors.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'home', selected: 'home_filled' }} sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="explore" sf={{ default: 'safari', selected: 'safari.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disabled hidden={!session} listeners={{ tabPress: openComposer }} name="create">
        <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="add_circle" sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'notifications', selected: 'notifications_active' }} sf={{ default: 'bell', selected: 'bell.fill' }} />
        {unread > 0 ? <NativeTabs.Trigger.Badge>{unread > 9 ? '9+' : String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'person_outline', selected: 'person' }} sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
