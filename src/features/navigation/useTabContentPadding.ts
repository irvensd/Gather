import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabContentPadding } from '@/theme/tokens';

export function useTabContentPadding(): number {
  const insets = useSafeAreaInsets();
  return tabContentPadding(insets.bottom);
}
