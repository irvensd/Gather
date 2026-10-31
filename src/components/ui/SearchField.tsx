import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search conversations and communities',
  onPress,
  autoFocus,
}: {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  onPress?: () => void;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  const field = (
    <View
      style={{
        minHeight: 44,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      <Ionicons name="search" size={18} color={theme.colors.secondary} />
      {onPress ? (
        <Text style={[theme.type.body, { color: theme.colors.secondary, flex: 1 }]}>{placeholder}</Text>
      ) : (
        <TextInput
          accessibilityLabel={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, { flex: 1, color: theme.colors.text, paddingVertical: 10 }]}
          testID="search-input"
          value={value}
        />
      )}
    </View>
  );
  if (!onPress) return field;
  return (
    <Pressable accessibilityRole="search" onPress={onPress}>
      {field}
    </Pressable>
  );
}
