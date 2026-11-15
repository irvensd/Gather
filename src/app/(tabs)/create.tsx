import { Redirect, useIsFocused } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';

/** The Create tab never shows its own screen. It only redirects while it is the open tab, so a signed-out launch stays on Home. */
export default function CreateScreen() {
  const focused = useIsFocused();
  const { ready, session } = useAuth();
  if (!focused || !ready) return null;
  if (!session) return <Redirect href="/" />;
  return <Redirect href="/compose" />;
}
