import { Platform, type TextStyle } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  onPrimary: string;
  text: string;
  secondary: string;
  border: string;
  highlight: string;
  accent: string;
  danger: string;
  overlay: string;
}

export const palette: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '#F8F9F6',
    surface: '#FFFFFF',
    primary: '#244F46',
    onPrimary: '#FFFFFF',
    text: '#18221F',
    secondary: '#6F7974',
    border: '#E7EAE5',
    highlight: '#EDF3EE',
    accent: '#244F46',
    danger: '#8C3A3A',
    overlay: 'rgba(16, 23, 20, 0.4)',
  },
  dark: {
    background: '#101714',
    surface: '#19221E',
    primary: '#8EBCAA',
    onPrimary: '#10211C',
    text: '#F5F7F3',
    secondary: '#A2AEA6',
    border: '#303C35',
    highlight: '#24312B',
    accent: '#8EBCAA',
    danger: '#E3A3A3',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const layout = {
  hitSlop: 8,
  touchTarget: 44,
  tabBarHeight: 64,
  tabBarGap: 24,
  previewLines: 3,
  scriptureChipLimit: 3,
} as const;

/** Extra list padding so the last row clears the floating tab bar and home indicator. */
export function tabContentPadding(safeBottom: number): number {
  return layout.tabBarHeight + layout.tabBarGap + Math.max(safeBottom, 8);
}

const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export const type = {
  largeTitle: { fontFamily, fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  section: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  postTitle: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '400' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

export type TypeName = keyof typeof type;
