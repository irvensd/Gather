import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { avatarUri, initials } from '@/lib/avatar';
import { useTheme } from '@/theme/ThemeProvider';

export function UserAvatar({ name, path, size = 36 }: { name: string | null; path: string | null; size?: number }) {
  const theme = useTheme();
  const uri = avatarUri(path);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.highlight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image accessibilityIgnoresInvertColors source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={[theme.type.label, { color: theme.colors.primary, fontSize: Math.max(12, Math.round(size * 0.36)), lineHeight: Math.max(16, Math.round(size * 0.46)) }]}>{initials(name)}</Text>
      )}
    </View>
  );
}
