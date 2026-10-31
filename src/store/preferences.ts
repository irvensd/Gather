import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Appearance = 'system' | 'light' | 'dark';

interface PreferenceState {
  appearance: Appearance;
  hasSeenWelcome: boolean;
  sabbathQuiet: boolean;
  sabbathPlaceId: string;
  setAppearance: (appearance: Appearance) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setSabbathQuiet: (sabbathQuiet: boolean) => void;
  setSabbathPlaceId: (sabbathPlaceId: string) => void;
}

export const usePreferences = create<PreferenceState>()(
  persist(
    (set) => ({
      appearance: 'system',
      hasSeenWelcome: false,
      sabbathQuiet: false,
      sabbathPlaceId: 'berrien-springs',
      setAppearance: (appearance) => set({ appearance }),
      setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
      setSabbathQuiet: (sabbathQuiet) => set({ sabbathQuiet }),
      setSabbathPlaceId: (sabbathPlaceId) => set({ sabbathPlaceId }),
    }),
    {
      name: 'gather.preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
