import { useEffect, useState } from 'react';

/**
 * Número de novedades pendientes de revisar (borradores). Lo calculan el panel «Revisar» y la barra de pestañas
 * para que la insignia se actualice al publicar o descartar sin recargar la app. Solo lo usan administradoras.
 */
let current = 0;
const listeners = new Set<(n: number) => void>();

export function setPendingCount(n: number) {
  current = n;
  listeners.forEach((fn) => fn(n));
}

export function usePendingCount(): number {
  const [n, setN] = useState(current);
  useEffect(() => {
    listeners.add(setN);
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}
