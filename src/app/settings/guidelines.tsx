import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ACCOUNT_DELETION_POLICY, COMMUNITY_GUIDELINES } from '@/constants/guidelines';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuidelinesScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Privacy and guidelines" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.lg }}>
        {COMMUNITY_GUIDELINES.map((item) => (
          <View key={item.title} style={{ gap: 4 }}>
            <Text style={[theme.type.section, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{item.body}</Text>
          </View>
        ))}
        <Text style={[theme.type.section, { color: theme.colors.text }]}>Account deletion</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{ACCOUNT_DELETION_POLICY}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
