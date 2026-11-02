import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { getApi } from '@/lib/backend';
import type { NotificationPreferences } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotificationSettingsScreen() {
  const signedIn = useRequireSignIn('/settings/notifications');
  const theme = useTheme();
  const preferences = useQuery({
    queryKey: ['notification-preferences'],
    enabled: signedIn,
    queryFn: async () => (await getApi()).getNotificationPreferences(),
  });
  const [override, setOverride] = useState<NotificationPreferences | null>(null);
  const replies = override?.replies ?? preferences.data?.replies ?? true;
  const mentions = override?.mentions ?? preferences.data?.mentions ?? true;
  const encouragement = override?.encouragement ?? preferences.data?.encouragement ?? true;
  const permission = useQuery({
    queryKey: ['notification-permission'],
    enabled: signedIn && Platform.OS !== 'web',
    queryFn: async () => (await Notifications.getPermissionsAsync()).status === 'granted',
  });
  const phoneAlerts = permission.data;
  async function save(next: NotificationPreferences) {
    setOverride(next);
    await (await getApi()).updateNotificationPreferences(next);
  }
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <ScreenHeader title="Notifications" />
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>
          {phoneAlerts === false
            ? 'Notifications are off for Gather. Turn them on in your phone settings to hear about a reply while the app is closed.'
            : 'Replies, mentions, and encouragement are also sent to this phone.'}
        </Text>
        <Row label="Replies" onValueChange={(value) => void save({ replies: value, mentions, encouragement })} value={replies} />
        <Row label="Mentions" onValueChange={(value) => void save({ replies, mentions: value, encouragement })} value={mentions} />
        <Row label="Prayers and thumbs up" onValueChange={(value) => void save({ replies, mentions, encouragement: value })} value={encouragement} />
        <Text style={[theme.type.body, { color: theme.colors.muted }]}>Moderator notices, like a removed post or a new report, always show up.</Text>
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, gap: theme.spacing.md }}>
      <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
      <Switch accessibilityLabel={label} onValueChange={onValueChange} value={value} />
    </View>
  );
}
