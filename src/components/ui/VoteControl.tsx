import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';
import type { VoteValue } from '@/types';

export function VoteControl({
  upvotes,
  downvotes,
  value,
  disabled,
  labeled = false,
  onVote,
}: {
  upvotes: number;
  downvotes: number;
  value: VoteValue;
  disabled?: boolean;
  labeled?: boolean;
  onVote: (value: -1 | 1) => void;
}) {
  const theme = useTheme();
  const press = (next: -1 | 1) => {
    if (disabled) return;
    void Haptics.selectionAsync().catch(() => undefined);
    onVote(next);
  };
  const iconSize = labeled ? 24 : 20;
  const count = (selected: boolean, color: string) => [
    labeled ? theme.type.body : theme.type.caption,
    { color: selected ? color : theme.colors.text, fontWeight: '600' as const, fontVariant: ['tabular-nums' as const] },
  ];
  const side = { minHeight: 44, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingRight: 8 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        accessibilityLabel={`Thumbs up, ${upvotes}`}
        accessibilityRole="button"
        accessibilityState={{ selected: value === 1, disabled }}
        disabled={disabled}
        onPress={() => press(1)}
        style={side}
      >
        <Ionicons color={value === 1 ? theme.colors.primary : theme.colors.muted} name={value === 1 ? 'thumbs-up' : 'thumbs-up-outline'} size={iconSize} />
        <Text style={count(value === 1, theme.colors.primary)}>{upvotes}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Thumbs down, ${downvotes}`}
        accessibilityRole="button"
        accessibilityState={{ selected: value === -1, disabled }}
        disabled={disabled}
        onPress={() => press(-1)}
        style={side}
      >
        <Ionicons color={value === -1 ? theme.colors.danger : theme.colors.muted} name={value === -1 ? 'thumbs-down' : 'thumbs-down-outline'} size={iconSize} />
        <Text style={count(value === -1, theme.colors.danger)}>{downvotes}</Text>
      </Pressable>
    </View>
  );
}
