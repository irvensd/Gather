import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';
import type { VoteValue } from '@/types';

export function VoteControl({
  score,
  value,
  disabled,
  onVote,
}: {
  score: number;
  value: VoteValue;
  disabled?: boolean;
  onVote: (value: -1 | 1) => void;
}) {
  const theme = useTheme();
  const press = (next: -1 | 1) => {
    if (disabled) return;
    void Haptics.selectionAsync().catch(() => undefined);
    onVote(next);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: theme.layout.touchTarget }}>
      <Pressable
        accessibilityLabel="Upvote"
        disabled={disabled}
        hitSlop={theme.layout.hitSlop}
        onPress={() => press(1)}
        style={{ width: 36, height: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons color={value === 1 ? theme.colors.primary : theme.colors.secondary} name={value === 1 ? 'arrow-up' : 'arrow-up-outline'} size={18} />
      </Pressable>
      <Text style={[theme.type.caption, { color: value === 0 ? theme.colors.secondary : theme.colors.text, minWidth: 20, textAlign: 'center', fontWeight: '600' }]}>{score}</Text>
      <Pressable
        accessibilityLabel="Downvote"
        disabled={disabled}
        hitSlop={theme.layout.hitSlop}
        onPress={() => press(-1)}
        style={{ width: 36, height: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons color={value === -1 ? theme.colors.danger : theme.colors.secondary} name={value === -1 ? 'arrow-down' : 'arrow-down-outline'} size={18} />
      </Pressable>
    </View>
  );
}
