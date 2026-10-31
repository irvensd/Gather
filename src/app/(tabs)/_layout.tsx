import { NativeTabs } from 'expo-router/native-tabs';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { TabBarContext } from '@/features/navigation/TabBarContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const theme = useTheme();
  const { session } = useAuth();
  const [hidden, setHidden] = useState(false);
  const notifications = useQuery({
    queryKey: ['notifications'],
    enabled: !!session,
    queryFn: async () => (await getApi()).listNotifications(),
  });
  const unread = notifications.data?.filter((item) => !item.isRead).length ?? 0;
  return (
    <TabBarContext value={{ setHidden }}>
      <NativeTabs
        activityEnabled
        backgroundColor={theme.colors.background}
        disableTransparentOnScrollEdge
        hidden={hidden}
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
        <NativeTabs.Trigger name="create">
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
    </TabBarContext>
  );
}
