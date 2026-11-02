import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { useTheme } from '@/theme/ThemeProvider';

export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
      <Text numberOfLines={1} style={[theme.type.section, { flex: 1, color: theme.colors.text }]}>
        {title}
      </Text>
    </View>
  );
}
