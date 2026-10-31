import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import type { NotificationPreferences } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const preferences = useQuery({ queryKey: ['notification-preferences'], queryFn: async () => (await getApi()).getNotificationPreferences() });
  const [override, setOverride] = useState<NotificationPreferences | null>(null);
  const replies = override?.replies ?? preferences.data?.replies ?? true;
  const mentions = override?.mentions ?? preferences.data?.mentions ?? true;
  async function save(next: NotificationPreferences) {
    setOverride(next);
    await (await getApi()).updateNotificationPreferences(next);
  }
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Notifications</Text>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Push delivery can be added later. These preferences already control in-app alerts.</Text>
        <Row label="Replies" onValueChange={(value) => void save({ replies: value, mentions })} value={replies} />
        <Row label="Mentions" onValueChange={(value) => void save({ replies, mentions: value })} value={mentions} />
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
      <Switch onValueChange={onValueChange} value={value} />
    </View>
  );
}
