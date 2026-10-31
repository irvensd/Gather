import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTabBar } from '@/features/navigation/TabBarContext';
import { Composer } from '@/features/posts/Composer';
import { useTheme } from '@/theme/ThemeProvider';

export default function CreateScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { setHidden } = useTabBar();
  useFocusEffect(
    useCallback(() => {
      setHidden(!!session);
      return () => setHidden(false);
    }, [session, setHidden]),
  );
  if (!session) {
    return (
      <ScreenContainer>
        <EmptyState
          actionLabel="Sign in"
          message="Reading is open. An account is only needed when you want to post, reply, vote, save, or report."
          onAction={() => router.push('/(auth)/sign-in')}
          title="Sign in to post"
        />
        <Text onPress={() => router.push('/(auth)/sign-up')} style={[theme.type.body, { color: theme.colors.primary, textAlign: 'center' }]}>
          Create an account
        </Text>
      </ScreenContainer>
    );
  }
  return (
    <Composer
      onClose={() => router.navigate('/')}
      onCreated={(id) => {
        router.navigate('/');
        router.push(`/post/${id}`);
      }}
    />
  );
}
