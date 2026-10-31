import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

function Bar({ width }: { width: `${number}%` | number }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          height: 14,
          width,
          borderRadius: 7,
          backgroundColor: theme.colors.highlight,
        },
        style,
      ]}
    />
  );
}

export function LoadingSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading" style={{ padding: theme.spacing.lg, gap: theme.spacing.xl }}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <Bar width="40%" />
          <Bar width="92%" />
          <Bar width="70%" />
        </View>
      ))}
    </View>
  );
}
