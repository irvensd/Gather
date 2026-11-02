import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function BlockedScreen() {
  const signedIn = useRequireSignIn('/settings/blocked');
  const theme = useTheme();
  const client = useQueryClient();
  const blocked = useQuery({ queryKey: ['blocked'], enabled: signedIn, queryFn: async () => (await getApi()).listBlocked() });
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <ScreenHeader title="Blocked accounts" />
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        {(blocked.data ?? []).length === 0 ? (
          <EmptyState message="People you block disappear from your feeds and notifications." title="No blocked accounts" />
        ) : null}
        {blocked.data?.map((person) => (
          <Pressable
            key={person.id}
            onPress={async () => {
              await (await getApi()).setBlocked(person.id, false);
              await client.invalidateQueries({ queryKey: ['blocked'] });
            }}
          >
            <Text style={[theme.type.body, { color: theme.colors.text }]}>@{person.username} · Unblock</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
