import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function AppHeader({
  title,
  wordmark = false,
  left,
  right,
}: {
  title?: string;
  wordmark?: boolean;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        minHeight: 52,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      {left}
      <Text
        accessibilityRole="header"
        style={[
          wordmark ? theme.type.title : theme.type.section,
          {
            flex: 1,
            color: wordmark ? theme.colors.primary : theme.colors.text,
            letterSpacing: wordmark ? -0.6 : -0.2,
          },
        ]}
      >
        {wordmark ? 'Gather' : title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{right}</View>
    </View>
  );
}
