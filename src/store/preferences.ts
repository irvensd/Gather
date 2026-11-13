import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Appearance = 'system' | 'light' | 'dark';

interface PreferenceState {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
}

export const usePreferences = create<PreferenceState>()(
  persist(
    (set) => ({
      appearance: 'system',
      setAppearance: (appearance) => set({ appearance }),
    }),
    {
      name: 'gather.preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

let preferencesHydrated = usePreferences.persist.hasHydrated();
const hydrationListeners = new Set<() => void>();

usePreferences.persist.onFinishHydration(() => {
  preferencesHydrated = true;
  hydrationListeners.forEach((listener) => listener());
});

export function usePreferencesHydrated() {
  return useSyncExternalStore(
    (listener) => {
      hydrationListeners.add(listener);
      return () => hydrationListeners.delete(listener);
    },
    () => preferencesHydrated,
    () => false,
  );
}
