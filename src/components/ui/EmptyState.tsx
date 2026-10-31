import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.xxxl, alignItems: 'center', gap: theme.spacing.md }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.highlight }} />
      <Text style={[theme.type.section, { color: theme.colors.text, textAlign: 'center' }]}>{title}</Text>
      <Text style={[theme.type.body, { color: theme.colors.secondary, textAlign: 'center' }]}>{message}</Text>
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
