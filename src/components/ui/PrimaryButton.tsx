import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        opacity: inactive ? 0.45 : pressed ? 0.72 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <Text style={[theme.type.section, { color: theme.colors.onPrimary }]}>{label}</Text>
      )}
    </Pressable>
  );
}
