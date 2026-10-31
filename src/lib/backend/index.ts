import type { GatherApi } from '@/lib/backend/api';
import { createDemoApi } from '@/lib/backend/demo/store';
import { createSupabaseApi } from '@/lib/backend/supabase/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';

let apiPromise: Promise<GatherApi> | null = null;

export function backendMode(): 'demo' | 'supabase' {
  return isSupabaseConfigured() ? 'supabase' : 'demo';
}

export function getApi(): Promise<GatherApi> {
  apiPromise ??= Promise.resolve(isSupabaseConfigured() ? createSupabaseApi() : createDemoApi());
  return apiPromise;
}
