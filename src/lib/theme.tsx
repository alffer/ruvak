// Tema claro/oscuro. Preferencia: «system» (por defecto: sigue al móvil y, si no dice nada, oscuro),
// «dark» o «light». Se guarda en el dispositivo. Al cambiar, se aplica la paleta (tokens.applyScheme) y se
// vuelve a montar el árbol para que todo se pinte con los colores nuevos.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { applyScheme, type SchemeName } from './tokens';

export type ThemePref = 'system' | 'dark' | 'light';
const KEY = 'ruvak:tema';

export function resolveScheme(pref: ThemePref, system: string | null | undefined): SchemeName {
  if (pref === 'dark' || pref === 'light') return pref;
  return system === 'light' ? 'light' : 'dark';
}

interface ThemeState {
  ready: boolean;
  pref: ThemePref;
  scheme: SchemeName;
  setPref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [system, setSystem] = useState(Appearance.getColorScheme());
  const scheme = resolveScheme(pref, system);
  // Se aplica durante el render, antes de que los hijos lean `colors` (es idempotente).
  applyScheme(scheme);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'dark' || v === 'light' || v === 'system') setPrefState(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme));
    return () => sub.remove();
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ready, pref, scheme, setPref }), [ready, pref, scheme, setPref]);
  // key = tema: al cambiar se vuelve a montar todo con la paleta nueva.
  return (
    <Ctx.Provider value={value}>
      <Fragment key={scheme}>{children}</Fragment>
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme fuera de ThemeProvider');
  return v;
}
