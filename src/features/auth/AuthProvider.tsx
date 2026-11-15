import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getApi } from '@/lib/backend';
import { queryClient } from '@/lib/queryClient';
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
  const sessionRef = useRef<AppSession | null>(null);

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
      try {
        const api = await getApi();
        let current: AppSession | null = null;
        try {
          current = await api.getSession();
        } catch {
          current = null;
        }
        if (!active) return;
        sessionRef.current = current;
        setSession(current);
        try {
          await loadProfile(current);
        } catch {
          if (!active) return;
          setProfile(null);
        }
        if (!active) return;
        setReady(true);
        unsubscribe = api.onAuthChange((next) => {
          if ((sessionRef.current?.userId ?? null) !== (next?.userId ?? null)) queryClient.clear();
          sessionRef.current = next;
          setSession(next);
          void loadProfile(next);
        });
      } catch {
        if (!active) return;
        setReady(true);
      }
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
