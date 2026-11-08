// Sesión, perfil, catálogos y ciudad activa. Un solo proveedor en src/app/_layout.tsx.
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { getCategories, getCities, getProfile } from './data';
import { isSupabaseConfigured, supabase } from './supabase';
import type { Category, City, Profile } from './types';

interface SessionState {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  interests: number[];
  cities: City[];
  categories: Category[];
  /** Ciudad activa: modifica Descubrir y Mapa, no la colección (§4). */
  activeCity: City | null;
  /** true si la ciudad activa es la habitual (si no, es una ciudad explorada). */
  isHomeCity: boolean;
  setActiveCityId: (id: number) => void;
  refreshProfile: () => Promise<void>;
  /** Se incrementa cuando cambian datos de la colección, para recargar pantallas. */
  version: number;
  bump: () => void;
  error: string | null;
}

const Ctx = createContext<SessionState | null>(null);

// Supabase recomienda pausar el refresco del token en segundo plano (solo móvil).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => (s === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh()));
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<number[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCityId, setActiveCityId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setProfile(null);
      setInterests([]);
      return;
    }
    try {
      const [p, cs, cats] = await Promise.all([getProfile(), getCities(), getCategories()]);
      setProfile(p?.profile ?? null);
      setInterests(p?.interests ?? []);
      setCities(cs);
      setCategories(cats);
      setActiveCityId((cur) => cur ?? p?.profile.homeCityId ?? cs[0]?.id ?? null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(async ({ data }) => {
      await loadUser(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // TOKEN_REFRESHED no cambia de usuario: no recargamos todo.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (event === 'SIGNED_OUT') setActiveCityId(null);
        // Fuera del callback: Supabase desaconseja llamadas await dentro de él.
        setTimeout(() => loadUser(s), 0);
      } else setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, [loadUser]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadUser(data.session);
  }, [loadUser]);

  const value = useMemo<SessionState>(() => {
    const activeCity = cities.find((c) => c.id === activeCityId) ?? null;
    return {
      ready,
      session,
      profile,
      interests,
      cities,
      categories,
      activeCity,
      isHomeCity: !!activeCity && activeCity.id === profile?.homeCityId,
      setActiveCityId,
      refreshProfile,
      version,
      bump: () => setVersion((v) => v + 1),
      error,
    };
  }, [ready, session, profile, interests, cities, categories, activeCityId, refreshProfile, version, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession fuera de SessionProvider');
  return v;
}

/** Nombre de una categoría por id (o null). */
export function useCategoryName() {
  const { categories } = useSession();
  return useCallback((id: number | null) => categories.find((c) => c.id === id)?.name ?? null, [categories]);
}
