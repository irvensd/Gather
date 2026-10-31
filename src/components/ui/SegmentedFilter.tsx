import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{ minHeight: 36, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: selected ? theme.colors.text : theme.colors.secondary, fontWeight: selected ? '600' : '400' }]}>
              {option.label}
            </Text>
            <View style={{ height: 2, marginTop: 6, borderRadius: 1, backgroundColor: selected ? theme.colors.primary : 'transparent' }} />
          </Pressable>
        );
      })}
    </View>
  );
}
