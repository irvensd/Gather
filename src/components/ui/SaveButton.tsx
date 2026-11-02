import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SaveButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={saved ? 'Unsave' : 'Save'}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
        opacity: pressed ? 0.45 : 1,
      })}
    >
      <Ionicons color={saved ? theme.colors.primary : theme.colors.muted} name={saved ? 'bookmark' : 'bookmark-outline'} size={22} />
    </Pressable>
  );
}
