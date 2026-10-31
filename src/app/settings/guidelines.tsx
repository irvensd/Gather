import { ScrollView, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ACCOUNT_DELETION_POLICY, COMMUNITY_GUIDELINES } from '@/constants/guidelines';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuidelinesScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Community guidelines</Text>
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
