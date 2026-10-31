import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getApi } from '@/lib/backend';
import type { AppSession, Profile } from '@/types';

interface AuthValue {
  ready: boolean;
  session: AppSession | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (next: AppSession | null) => {
    if (!next) {
      setProfile(null);
      return;
    }
    const api = await getApi();
    setProfile(await api.getCurrentProfile());
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;
    let active = true;
    void (async () => {
      const api = await getApi();
      const current = await api.getSession();
      if (!active) return;
      setSession(current);
      await loadProfile(current);
      if (!active) return;
      setReady(true);
      unsubscribe = api.onAuthChange((next) => {
        setSession(next);
        void loadProfile(next);
      });
    })();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      profile,
      refreshProfile: () => loadProfile(session),
    }),
    [ready, session, profile, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
