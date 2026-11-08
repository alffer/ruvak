// Carga asíncrona con estados de carga/error y recarga al volver a la pantalla o al cambiar datos.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from './session';

export interface Loaded<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const { version } = useSession();
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  // fn cambia en cada render; se ejecuta la última versión. Se recarga cuando cambia `key`.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const key = `${version}:${JSON.stringify(deps)}`;

  const run = useCallback(() => {
    const n = ++seq.current;
    setLoading(true);
    fnRef
      .current()
      .then((d) => {
        if (n !== seq.current) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => n === seq.current && setError(e.message || 'No se pudo cargar.'))
      .finally(() => n === seq.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume las dependencias de quien llama
  }, [key]);

  useFocusEffect(run);
  return { data, loading, error, reload: run };
}
