// Análisis de URLs compartidas (puro; comprobado por scripts/check-url.ts).
// No descarga nada: solo lee lo que ya viene en la dirección. RUVAK no hace scraping.
import type { SourceType } from './types';

export interface ParsedUrl {
  url: string;
  normalizedUrl: string;
  sourceType: SourceType;
  /** Identificador estable de Google Maps (cid o ftid) si viene en la URL. */
  externalId: string | null;
  /** Nombre sugerido (solo de URLs de Google Maps /place/Nombre). */
  name: string | null;
  lat: number | null;
  lng: number | null;
}

const TRACKING_PARAMS = /^(utm_.+|fbclid|gclid|igsh|igshid|si|_t|_r|is_from_webapp|sender_device|share_.+|entry|g_ep|g_st)$/i;

/** Añade https:// si falta y valida que sea http(s). Devuelve null si no es una URL. */
export function coerceUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null;
    return u;
  } catch {
    return null;
  }
}

/** URL normalizada para detectar duplicados: sin protocolo, www, parámetros de seguimiento ni barra final. */
export function normalizeUrl(input: string): string | null {
  const u = coerceUrl(input);
  if (!u) return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  const params = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.test(k)).sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${params.map(([k, v]) => `${k}=${v}`).join('&')}` : '';
  const path = decodeSafe(u.pathname).replace(/\/+$/, '');
  return `${host}${path}${query}`;
}

export function detectSourceType(host: string): SourceType {
  const h = host.toLowerCase();
  if (/(^|\.)instagram\.com$/.test(h)) return 'instagram';
  if (/(^|\.)tiktok\.com$/.test(h)) return 'tiktok';
  if (/^maps\.app\.goo\.gl$/.test(h) || /^goo\.gl$/.test(h) || /(^|\.)google\.[a-z.]+$/.test(h)) return 'google_maps';
  return 'url';
}

/** Identificador de Google Maps: `cid` decimal, `ftid` o el par hexadecimal 0x…:0x… de `data=`. */
export function googleMapsExternalId(u: URL): string | null {
  const cid = u.searchParams.get('cid');
  if (cid && /^\d+$/.test(cid)) return `gmaps:cid:${cid}`;
  const ftid = u.searchParams.get('ftid');
  if (ftid && /^0x[0-9a-f]+:0x[0-9a-f]+$/i.test(ftid)) return `gmaps:ftid:${ftid.toLowerCase()}`;
  const m = /!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i.exec(u.href);
  if (m) return `gmaps:ftid:${m[1].toLowerCase()}`;
  return null;
}

/** Coordenadas en una URL de Google Maps: `!3dLAT!4dLNG` (la del lugar) o `@LAT,LNG` (la vista). */
export function googleMapsCoords(href: string): { lat: number; lng: number } | null {
  const place = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(href);
  const view = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(href);
  const q = /[?&](?:q|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:&|$)/.exec(href);
  const m = place ?? q ?? view;
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function googleMapsName(u: URL): string | null {
  const m = /\/maps\/place\/([^/@]+)/.exec(u.pathname);
  if (m) {
    const name = decodeSafe(m[1].replace(/\+/g, ' ')).trim();
    // «43.5,-5.6» no es un nombre.
    if (name && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(name)) return name;
  }
  const q = u.searchParams.get('q') ?? u.searchParams.get('query');
  if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q.trim())) return q.trim();
  return null;
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseSharedUrl(input: string): ParsedUrl | null {
  const u = coerceUrl(input);
  if (!u) return null;
  const sourceType = detectSourceType(u.hostname);
  const isMaps = sourceType === 'google_maps' && (u.hostname.startsWith('maps.') || u.pathname.startsWith('/maps') || u.searchParams.has('cid'));
  const coords = isMaps ? googleMapsCoords(u.href) : null;
  return {
    url: u.href,
    normalizedUrl: normalizeUrl(u.href) ?? u.href,
    sourceType,
    externalId: isMaps ? googleMapsExternalId(u) : null,
    name: isMaps ? googleMapsName(u) : null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
}
