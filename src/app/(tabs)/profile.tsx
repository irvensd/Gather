import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileBody } from '@/features/profile/ProfileBody';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, profile } = useAuth();
  const capabilities = useQuery({
    queryKey: ['capabilities'],
    enabled: !!session,
    queryFn: async () => (await import('@/lib/backend')).getApi().then((api) => api.getCapabilities()),
  });
  if (!session || !profile) {
    return (
      <ScreenContainer>
        <EmptyState actionLabel="Sign in" message="You can read every conversation without an account. Sign in to post, reply, vote, save, or report." onAction={() => router.push('/(auth)/sign-in')} title="No account yet" />
        <Text onPress={() => router.push('/(auth)/sign-up')} style={[theme.type.body, { color: theme.colors.primary, textAlign: 'center' }]}>Create an account</Text>
      </ScreenContainer>
    );
  }
  const canModerate = !!capabilities.data && (capabilities.data.isAdmin || capabilities.data.communityIds.length > 0);
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: theme.spacing.xs }}>
        {canModerate ? (
          <Pressable onPress={() => router.push('/moderation')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Moderation</Text>
          </Pressable>
        ) : null}
        <IconButton label="Settings" name="settings-outline" onPress={() => router.push('/settings')} />
      </View>
      <ProfileBody username={profile.username} />
    </ScreenContainer>
  );
}
