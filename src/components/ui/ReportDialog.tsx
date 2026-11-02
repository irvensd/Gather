import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { REPORT_REASONS } from '@/constants/reportReasons';
import { useTheme } from '@/theme/ThemeProvider';
import type { ReportReason } from '@/types';

export function ReportDialog({
  visible,
  onClose,
  onSubmit,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
  submitting?: boolean;
}) {
  const theme = useTheme();
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <Text style={[theme.type.section, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>Report</Text>
      {REPORT_REASONS.map((item) => {
        const selected = item.value === reason;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setReason(item.value)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: selected ? theme.colors.primary : theme.colors.text, fontWeight: selected ? '600' : '400' }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <TextInput
        multiline
        onChangeText={setDetails}
        placeholder="Optional details"
        placeholderTextColor={theme.colors.secondary}
        style={[theme.type.body, { color: theme.colors.text, minHeight: 72, marginVertical: theme.spacing.md, textAlignVertical: 'top' }]}
        value={details}
      />
      <PrimaryButton label="Submit report" loading={submitting} onPress={() => onSubmit(reason, details)} testID="report-submit" />
    </BottomSheet>
  );
}
