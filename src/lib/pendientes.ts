import { useEffect, useState } from 'react';

/**
 * Número de novedades pendientes de revisar (borradores). `null` = no se ha podido comprobar (no es lo mismo que 0).
 * Lo calculan la cabecera y el panel «Revisar»; solo lo usan administradoras.
 */
let current: number | null = null;
const listeners = new Set<(n: number | null) => void>();

export function setPendingCount(n: number | null) {
  current = n;
  listeners.forEach((fn) => fn(n));
}

export function usePendingCount(): number | null {
  const [n, setN] = useState<number | null>(current);
  useEffect(() => {
    listeners.add(setN);
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}
