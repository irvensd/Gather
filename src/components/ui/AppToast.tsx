import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

export function AppToast() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToast((state) => state.message);
  const clear = useToast((state) => state.clear);
  const shown = useSharedValue(0);
  const hiding = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function hide() {
    if (hiding.current) return;
    hiding.current = true;
    if (timer.current) clearTimeout(timer.current);
    shown.value = withTiming(0, { duration: 220, easing: EASE_IN }, (finished) => {
      if (finished) runOnJS(clear)();
    });
  }

  useEffect(() => {
    if (!message) return;
    let cancelled = false;
    hiding.current = false;
    shown.value = withTiming(1, { duration: 280, easing: EASE_OUT });
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || !reduce) return;
      shown.value = 1;
    });
    timer.current = setTimeout(hide, 2200);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
    // The exit timer is started with the message and cleared on the next one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, shown]);

  const motion = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 14 }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          bottom: insets.bottom + 72,
        },
        motion,
      ]}
    >
      <Pressable
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        onPress={hide}
        style={{
          backgroundColor: theme.colors.text,
          borderRadius: theme.radius.md,
          minHeight: 48,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[theme.type.body, { color: theme.colors.background, fontWeight: '600', textAlign: 'center' }]}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}
