import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { composeModerationReason, MODERATION_REASONS, type ModerationAction } from '@/constants/moderationReasons';
import { useTheme } from '@/theme/ThemeProvider';

export interface ModerationRequest {
  action: ModerationAction;
  targetType: 'post' | 'comment';
}

function sheetCopy({ action, targetType }: ModerationRequest) {
  const thing = targetType === 'post' ? 'post' : 'comment';
  if (action === 'remove') return { title: `Remove this ${thing}?`, confirm: `Remove ${thing}`, hint: 'The author sees this reason in Activity.' };
  if (action === 'lock') return { title: 'Lock this discussion?', confirm: 'Lock discussion', hint: 'No one can add new comments while it is locked.' };
  if (action === 'unlock') return { title: 'Unlock this discussion?', confirm: 'Unlock discussion', hint: 'People can comment again.' };
  return { title: 'Dismiss this report?', confirm: 'Dismiss report', hint: 'The content stays up.' };
}

/** Mount with a `key` per request so the chosen reason resets each time. */
export function ModerationSheet({
  request,
  onClose,
  onSubmit,
}: {
  request: ModerationRequest | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const theme = useTheme();
  const presets = request ? MODERATION_REASONS[request.action] : [];
  const [preset, setPreset] = useState<string>(presets[0] ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const copy = request ? sheetCopy(request) : null;

  async function submit() {
    setBusy(true);
    try {
      await onSubmit(composeModerationReason(preset, note));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet onClose={busy ? () => undefined : onClose} visible={!!request}>
      <Text style={[theme.type.section, { color: theme.colors.text }]}>{copy?.title}</Text>
      <Text style={[theme.type.body, { color: theme.colors.muted, marginTop: 4, marginBottom: theme.spacing.md }]}>{copy?.hint}</Text>
      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600', marginBottom: 4 }]}>Reason</Text>
      <View accessibilityRole="radiogroup">
        {presets.map((item) => {
          const selected = item === preset;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setPreset(item)}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
            >
              <Ionicons color={selected ? theme.colors.primary : theme.colors.muted} name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} />
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: selected ? '600' : '400' }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel="Note (optional)"
        maxLength={300}
        multiline
        onChangeText={setNote}
        placeholder="Add a note (optional)"
        placeholderTextColor={theme.colors.secondary}
        style={[
          theme.type.body,
          {
            color: theme.colors.text,
            minHeight: 64,
            marginVertical: theme.spacing.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            textAlignVertical: 'top',
          },
        ]}
        value={note}
      />
      <PrimaryButton label={copy?.confirm ?? 'Confirm'} loading={busy} onPress={() => void submit()} testID="moderation-submit" />
    </BottomSheet>
  );
}
