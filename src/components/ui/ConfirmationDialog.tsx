import { Modal, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme/ThemeProvider';

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
  secondaryLabel,
  onSecondary,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable onPress={onCancel} style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: theme.spacing.xxl }}>
        <Pressable onPress={() => undefined} style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <Text style={[theme.type.section, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{message}</Text>
          <View style={{ gap: theme.spacing.sm }}>
            {destructive ? (
              <PrimaryButton label={confirmLabel} onPress={onConfirm} />
            ) : (
              <PrimaryButton label={confirmLabel} onPress={onConfirm} />
            )}
            {secondaryLabel && onSecondary ? <SecondaryButton label={secondaryLabel} onPress={onSecondary} /> : null}
            <SecondaryButton label="Cancel" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
