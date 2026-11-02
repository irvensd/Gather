import { Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function PrayedButton({ count, prayed, onPress }: { count: number; prayed: boolean; onPress: () => void }) {
  const theme = useTheme();
  const people = count === 1 ? '1 person' : `${count} people`;
  const label = prayed ? `Prayed · ${people}` : count === 0 ? 'I prayed' : `I prayed · ${people}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: prayed }}
      onPress={onPress}
      style={{
        alignSelf: 'flex-start',
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        backgroundColor: prayed ? theme.colors.highlight : theme.colors.surface,
        borderWidth: 1,
        borderColor: prayed ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text style={[theme.type.body, { color: prayed ? theme.colors.primary : theme.colors.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}
