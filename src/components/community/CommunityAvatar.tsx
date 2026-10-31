import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function CommunityAvatar({ icon, size = 28 }: { icon: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.highlight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons color={theme.colors.primary} name={(icon as keyof typeof Ionicons.glyphMap) || 'ellipse-outline'} size={size * 0.55} />
    </View>
  );
}
