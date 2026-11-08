// Datos gratuitos de OpenStreetMap para completar un alta a partir de un enlace de Google Maps.
// Solo se usan coordenadas y nombre que ya vienen en el enlace. Nada se inventa: si no hay coincidencia, no se sugiere nada.
// Licencia de los datos: ODbL («© OpenStreetMap contributors»). Comprobación de la lógica pura: scripts/check-osm.ts.

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

export interface OsmSuggestion {
  /** Dirección legible («Calle Corrida 12, 33201 Gijón»), o null si no hay calle. */
  address: string | null;
  /** Slug de categoría de RUVAK (de scripts/seed), solo si el nombre coincide con un POI cercano. */
  categorySlug: string | null;
}

/** Nombre comparable: minúsculas, sin acentos ni signos, espacios simples. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Etiquetas de OSM → categoría de RUVAK. Solo lo inequívoco; lo demás no sugiere categoría. */
export function categorySlugFromTags(tags: Record<string, string>): string | null {
  const a = tags.amenity;
  const s = tags.shop;
  const t = tags.tourism;
  if (a === 'cafe') return 'cafeterias';
  if (a === 'restaurant' || a === 'fast_food') return 'restaurantes';
  if (a === 'bar' || a === 'pub' || a === 'biergarten') return 'bares';
  if (a === 'library' || s === 'books') return 'librerias';
  if (a === 'theatre' || a === 'arts_centre' || a === 'cinema') return 'cultura';
  if (t === 'museum') return 'museos';
  if (a === 'marketplace') return 'mercados';
  if (tags.craft) return 'talleres';
  if (s) return 'tiendas';
  return null;
}

/** «Calle X, 12» + «33201» + «Gijón» → «Calle X 12, 33201 Gijón». Sin calle no hay dirección fiable. */
export function formatAddress(addr: Record<string, string | undefined>): string | null {
  const road = addr.road ?? addr.pedestrian ?? addr.footway;
  if (!road) return null;
  const street = [road, addr.house_number].filter(Boolean).join(' ');
  const town = addr.city ?? addr.town ?? addr.village ?? addr.municipality;
  const locality = [addr.postcode, town].filter(Boolean).join(' ');
  return [street, locality].filter(Boolean).join(', ');
}

/** De los POI cercanos, elige el que tiene exactamente el mismo nombre (normalizado). Sin coincidencia → null. */
export function pickNamedPoi(elements: { tags?: Record<string, string> }[], name: string): Record<string, string> | null {
  const wanted = normalizeName(name);
  if (!wanted) return null;
  const hit = elements.find((e) => e.tags?.name && normalizeName(e.tags.name) === wanted);
  return hit?.tags ?? null;
}

const TIMEOUT_MS = 12000;

async function getJson(url: string, init?: RequestInit): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Consulta OpenStreetMap (Nominatim para la dirección, Overpass para el POI). Nunca lanza: si falla, devuelve vacío. */
export async function suggestFromOsm(lat: number, lng: number, name: string | null): Promise<OsmSuggestion> {
  // Las dos consultas son independientes: van en paralelo para no sumar sus esperas.
  const [reverse, over] = await Promise.all([
    getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=es&lat=${lat}&lon=${lng}`),
    name
      ? getJson('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(`[out:json][timeout:15];(nwr(around:60,${lat},${lng})["name"];);out tags 40;`)}`,
        })
      : Promise.resolve(null),
  ]);
  const address = reverse?.address ? formatAddress(reverse.address) : null;
  const tags = name && over?.elements ? pickNamedPoi(over.elements, name) : null;
  const categorySlug = tags ? categorySlugFromTags(tags) : null;
  return { address, categorySlug };
}
