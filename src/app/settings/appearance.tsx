import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { usePreferences, type Appearance } from '@/store/preferences';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppearanceScreen() {
  const theme = useTheme();
  const appearance = usePreferences((state) => state.appearance);
  const setAppearance = usePreferences((state) => state.setAppearance);
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Appearance" />
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, gap: theme.spacing.lg }}>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>System follows the device. Light and dark stay put until you change them.</Text>
        <SegmentedFilter<Appearance> onChange={setAppearance} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} value={appearance} />
      </View>
    </ScreenContainer>
  );
}
