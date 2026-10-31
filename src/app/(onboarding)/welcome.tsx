import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { usePreferences } from '@/store/preferences';
import { useTheme } from '@/theme/ThemeProvider';

export default function WelcomeScreen() {
  const theme = useTheme();
  const setSeen = usePreferences((state) => state.setHasSeenWelcome);
  function browse() {
    setSeen(true);
    router.replace('/');
  }
  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: theme.spacing.xxl, justifyContent: 'flex-end', gap: theme.spacing.lg }}>
        <Text style={[theme.type.largeTitle, { color: theme.colors.primary }]}>Gather</Text>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Faith. Questions. Community.</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>A place for Bible questions, ordinary life, and the people who understand both.</Text>
        <PrimaryButton label="Create an account" onPress={() => { setSeen(true); router.push('/(auth)/sign-up'); }} testID="welcome-create" />
        <SecondaryButton label="I have an account" onPress={() => { setSeen(true); router.push('/(auth)/sign-in'); }} />
        <Text onPress={browse} style={[theme.type.body, { color: theme.colors.primary, textAlign: 'center' }]} testID="welcome-browse">Browse first</Text>
      </View>
    </ScreenContainer>
  );
}
