import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Appearance = 'system' | 'light' | 'dark';

interface PreferenceState {
  appearance: Appearance;
  hasSeenWelcome: boolean;
  setAppearance: (appearance: Appearance) => void;
  setHasSeenWelcome: (seen: boolean) => void;
}

export const usePreferences = create<PreferenceState>()(
  persist(
    (set) => ({
      appearance: 'system',
      hasSeenWelcome: false,
      setAppearance: (appearance) => set({ appearance }),
      setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
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
