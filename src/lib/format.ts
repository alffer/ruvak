// Formato de fechas y textos para la interfaz (castellano).
import { Linking, Platform } from 'react-native';

const DATE = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? '' : DATE.format(d);
}

/** Enlace a Google Maps para navegar o ver reseñas/horarios (§8: enlazar, no copiar). */
export function mapsUrl(p: { name: string; address: string | null; lat: number | null; lng: number | null }): string {
  const q = p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : [p.name, p.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function openExternal(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url);
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
