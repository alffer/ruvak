// Detección de posibles duplicados (puro; comprobado por scripts/check-dedupe.ts).
// RF-03: por identificador externo, URL normalizada y coincidencia de nombre/dirección.
// Nunca fusiona sola: devuelve candidatos y la persona decide.

export interface DedupeCandidate {
  id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  externalIds: string[];
  normalizedUrls: string[];
}

export interface DedupeInput {
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  externalId?: string | null;
  normalizedUrl?: string | null;
}

export type DuplicateReason = 'external_id' | 'url' | 'name_address' | 'name_location' | 'name';

export interface DuplicateMatch {
  placeId: number;
  name: string;
  address: string | null;
  reason: DuplicateReason;
}

export const DUPLICATE_REASON_LABELS: Record<DuplicateReason, string> = {
  external_id: 'Mismo lugar de Google Maps',
  url: 'Mismo enlace',
  name_address: 'Mismo nombre y dirección',
  name_location: 'Mismo nombre y muy cerca',
  name: 'Mismo nombre',
};

/** Igual que public.ruvak_name_key() en SQL: minúsculas, sin tildes, solo letras y números. */
export function nameKey(input: string | null | undefined): string {
  const from = 'áàäâãéèëêíìïîóòöôõúùüûñç';
  const to = 'aaaaaeeeeiiiiooooouuuunc';
  let s = '';
  for (const ch of (input ?? '').toLowerCase()) {
    const i = from.indexOf(ch);
    s += i >= 0 ? to[i] : ch;
  }
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Dirección comparable: sin tildes, sin abreviaturas habituales de vía ni código postal. */
export function addressKey(input: string | null | undefined): string {
  return (
    nameKey(input)
      // tipo de vía y artículos («Pº» queda como «p» tras quitar «º»)
      .replace(/\b(calle|c|avenida|avda|av|plaza|pza|pl|paseo|p|camino|carretera|ctra|de|del|la|el|los|las)\b/g, ' ')
      .replace(/\b\d{5}\b/g, ' ')
      .replace(/\b(espana|spain|asturias)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Distancia en metros (haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distancia máxima para considerar que dos lugares con el mismo nombre son el mismo. */
export const SAME_PLACE_METERS = 150;

export function findDuplicates(input: DedupeInput, candidates: DedupeCandidate[]): DuplicateMatch[] {
  const key = nameKey(input.name);
  const addr = addressKey(input.address);
  const out: DuplicateMatch[] = [];
  for (const c of candidates) {
    let reason: DuplicateReason | null = null;
    if (input.externalId && c.externalIds.includes(input.externalId)) reason = 'external_id';
    else if (input.normalizedUrl && c.normalizedUrls.includes(input.normalizedUrl)) reason = 'url';
    else if (key && nameKey(c.name) === key) {
      const cAddr = addressKey(c.address);
      const hasBothCoords = input.lat != null && input.lng != null && c.lat != null && c.lng != null;
      if (addr && cAddr && (addr === cAddr || addr.includes(cAddr) || cAddr.includes(addr))) reason = 'name_address';
      else if (hasBothCoords && distanceMeters({ lat: input.lat!, lng: input.lng! }, { lat: c.lat!, lng: c.lng! }) <= SAME_PLACE_METERS)
        reason = 'name_location';
      else if (hasBothCoords)
        reason = null; // mismo nombre pero lejos: otra sucursal, no es duplicado
      else if (!(addr && cAddr)) reason = 'name'; // sin datos para distinguir: se avisa
    }
    if (reason) out.push({ placeId: c.id, name: c.name, address: c.address, reason });
  }
  const order: DuplicateReason[] = ['external_id', 'url', 'name_address', 'name_location', 'name'];
  return out.sort((a, b) => order.indexOf(a.reason) - order.indexOf(b.reason));
}
