import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferences } from '@/store/preferences';
import { layout, palette, radius, spacing, type, type ThemeColors } from '@/theme/tokens';

export interface GatherTheme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  type: typeof type;
}

const ThemeContext = createContext<GatherTheme | null>(null);

export function GatherThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const appearance = usePreferences((state) => state.appearance);
  const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  const value = useMemo<GatherTheme>(
    () => ({
      scheme,
      colors: palette[scheme],
      spacing,
      radius,
      layout,
      type,
    }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): GatherTheme {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within GatherThemeProvider');
  return value;
}
