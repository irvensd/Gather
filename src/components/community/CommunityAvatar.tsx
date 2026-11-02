import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { communityColorTone } from '@/constants/communityColors';
import { useTheme } from '@/theme/ThemeProvider';

export function CommunityAvatar({ icon, color, size = 28 }: { icon: string; color?: string | null; size?: number }) {
  const theme = useTheme();
  const tone = communityColorTone(color, theme.scheme);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons color={tone.foreground} name={(icon as keyof typeof Ionicons.glyphMap) || 'ellipse-outline'} size={size * 0.55} />
    </View>
  );
}
