import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { usePending } from '@/store/pending';

/** Sends a signed-out person to sign-in, and brings them back here afterwards. */
export function useRequireSignIn(returnTo: string) {
  const { ready, session } = useAuth();
  useEffect(() => {
    if (!ready || session) return;
    usePending.getState().setPending(returnTo);
    router.replace('/(auth)/sign-in');
  }, [ready, session, returnTo]);
  return !!session;
}
