import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/** True only in a build that includes the store billing module. Expo Go does not. */
export function hasSupportStore(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  try {
    return requireOptionalNativeModule('ExpoIap') != null;
  } catch {
    return false;
  }
}
