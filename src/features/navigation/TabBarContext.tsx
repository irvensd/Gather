import { createContext, useContext } from 'react';

export const TabBarContext = createContext<{ setHidden: (hidden: boolean) => void }>({ setHidden: () => undefined });

export function useTabBar() {
  return useContext(TabBarContext);
}
