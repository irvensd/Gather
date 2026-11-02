import { router } from 'expo-router';
import { Text } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileBody } from '@/features/profile/ProfileBody';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, profile } = useAuth();
  const settings = <IconButton label="Settings" name="settings-outline" onPress={() => router.push('/settings')} />;
  if (!session || !profile) {
    return (
      <ScreenContainer>
        <AppHeader right={settings} title="Profile" />
        <EmptyState
          actionLabel="Sign in"
          icon="person-circle-outline"
          message="You can read every conversation without an account. Sign in to post, reply, vote, save, or report."
          onAction={() => {
            usePending.getState().setPending('/profile');
            router.push('/(auth)/sign-in');
          }}
          title="No account yet"
        />
        <Text onPress={() => router.push('/(auth)/sign-up')} style={[theme.type.body, { color: theme.colors.primary, textAlign: 'center', fontWeight: '600', paddingVertical: 12 }]}>
          Create an account
        </Text>
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <AppHeader right={settings} title="Profile" />
      <ProfileBody username={profile.username} />
    </ScreenContainer>
  );
}
