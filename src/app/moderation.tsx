import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function ModerationScreen() {
  const theme = useTheme();
  const client = useQueryClient();
  const [reason, setReason] = useState('Reviewed by a moderator');
  const reports = useQuery({ queryKey: ['reports'], queryFn: async () => (await getApi()).listReports() });
  const history = useQuery({ queryKey: ['moderation-history'], queryFn: async () => (await getApi()).listModerationHistory() });
  return (
    <ScreenContainer>
      <Text onPress={() => router.back()} style={[theme.type.body, { color: theme.colors.primary, padding: theme.spacing.lg }]}>Close</Text>
      <FlatList
        data={reports.data?.filter((report) => report.status === 'open') ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={[theme.type.title, { color: theme.colors.text, padding: theme.spacing.lg }]}>Reports</Text>}
        ListFooterComponent={
          <View style={{ padding: theme.spacing.lg, gap: 8 }}>
            <Text style={[theme.type.section, { color: theme.colors.text }]}>History</Text>
            {history.data?.map((item) => (
              <Text key={item.id} style={[theme.type.caption, { color: theme.colors.secondary }]}>{item.action} · {item.communityName} · {item.reason}</Text>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ padding: theme.spacing.lg, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Text style={[theme.type.body, { color: theme.colors.text }]}>{item.reason.replaceAll('_', ' ')} · c/{item.communityName}</Text>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{item.excerpt}</Text>
            <TextInput onChangeText={setReason} style={[theme.type.body, { color: theme.colors.text }]} value={reason} />
            <PrimaryButton label="Remove" onPress={() => act(item, 'remove')} />
            {item.targetType === 'post' ? <SecondaryButton label="Lock" onPress={() => act(item, 'lock')} /> : null}
            <SecondaryButton label="Dismiss" onPress={() => act(item, 'dismiss')} />
          </View>
        )}
      />
    </ScreenContainer>
  );

  async function act(item: NonNullable<typeof reports.data>[number], action: 'remove' | 'lock' | 'dismiss') {
    await (await getApi()).moderate({ reportId: item.id, communityId: item.communityId, targetType: item.targetType, targetId: item.targetId, action, reason });
    await client.invalidateQueries({ queryKey: ['reports'] });
    await client.invalidateQueries({ queryKey: ['moderation-history'] });
  }
}
