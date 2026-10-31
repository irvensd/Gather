import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function BlockedScreen() {
  const theme = useTheme();
  const client = useQueryClient();
  const blocked = useQuery({ queryKey: ['blocked'], queryFn: async () => (await getApi()).listBlocked() });
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Blocked accounts" />
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, gap: theme.spacing.md }}>
        {(blocked.data ?? []).length === 0 ? <EmptyState message="People you block disappear from your feeds and notifications." title="No blocked accounts" /> : null}
        {blocked.data?.map((person) => (
          <Pressable key={person.id} onPress={async () => { await (await getApi()).setBlocked(person.id, false); await client.invalidateQueries({ queryKey: ['blocked'] }); }}>
            <Text style={[theme.type.body, { color: theme.colors.text }]}>@{person.username} · Unblock</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
