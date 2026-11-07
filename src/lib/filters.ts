// Búsqueda, filtros y orden de la colección (puro; comprobado por scripts/check-filters.ts). RF-06.
import { nameKey } from './dedupe';
import type { SavedPlace, VisitStatus } from './types';

/** Listas sugeridas: vistas de los estados personales (no se guardan como listas). */
export type SmartList = 'pending' | 'favorites' | 'visited';

export const SMART_LISTS: { key: SmartList; name: string }[] = [
  { key: 'pending', name: 'Pendientes' },
  { key: 'favorites', name: 'Favoritos' },
  { key: 'visited', name: 'Visitados' },
];

export type StatusFilter = 'all' | VisitStatus | 'favorites' | 'none';
export type SortKey = 'recent' | 'name';

export interface PlaceFilters {
  q: string;
  status: StatusFilter;
  categoryId: number | null;
  collectionId: number | null;
  smart: SmartList | null;
  cityId: number | null;
  zone: string | null;
  showArchived: boolean;
  onlyWithLocation: boolean;
}

export const EMPTY_FILTERS: PlaceFilters = {
  q: '',
  status: 'all',
  categoryId: null,
  collectionId: null,
  smart: null,
  cityId: null,
  zone: null,
  showArchived: false,
  onlyWithLocation: false,
};

export function inSmartList(p: SavedPlace, s: SmartList): boolean {
  if (s === 'favorites') return p.me.favorite;
  return p.me.status === s;
}

/** Texto en el que se busca: nombre, dirección, zona, categoría, nota privada y etiquetas. */
function haystack(p: SavedPlace, categoryName: string | null): string {
  return nameKey([p.name, p.address, p.zone, categoryName, p.description, p.me.note, p.me.tags.join(' ')].filter(Boolean).join(' '));
}

export function filterPlaces(places: SavedPlace[], f: PlaceFilters, categoryName: (id: number | null) => string | null): SavedPlace[] {
  const terms = nameKey(f.q).split(' ').filter(Boolean);
  return places.filter((p) => {
    if (!f.showArchived && p.archived) return false;
    if (f.status === 'favorites' && !p.me.favorite) return false;
    if (f.status === 'none' && p.me.status != null) return false;
    if (f.status !== 'all' && f.status !== 'favorites' && f.status !== 'none' && p.me.status !== f.status) return false;
    // Los descartados no salen salvo que se pidan expresamente.
    if (f.status === 'all' && p.me.status === 'discarded' && !f.smart) return false;
    if (f.categoryId != null && p.categoryId !== f.categoryId) return false;
    if (f.collectionId != null && !p.collectionIds.includes(f.collectionId)) return false;
    if (f.smart && !inSmartList(p, f.smart)) return false;
    if (f.cityId != null && p.cityId != null && p.cityId !== f.cityId) return false;
    if (f.zone && nameKey(p.zone) !== nameKey(f.zone)) return false;
    if (f.onlyWithLocation && (p.lat == null || p.lng == null)) return false;
    if (terms.length) {
      const h = haystack(p, categoryName(p.categoryId));
      if (!terms.every((t) => h.includes(t))) return false;
    }
    return true;
  });
}

const collator = new Intl.Collator('es', { sensitivity: 'base' });

export function sortPlaces(places: SavedPlace[], key: SortKey): SavedPlace[] {
  const out = [...places];
  if (key === 'name') out.sort((a, b) => collator.compare(a.name, b.name));
  else out.sort((a, b) => b.me.savedAt.localeCompare(a.me.savedAt));
  return out;
}

/** Zonas presentes en la colección, para el filtro por zona (solo si existe el dato). */
export function zonesOf(places: SavedPlace[]): string[] {
  const seen = new Map<string, string>();
  for (const p of places) if (p.zone && !seen.has(nameKey(p.zone))) seen.set(nameKey(p.zone), p.zone);
  return [...seen.values()].sort(collator.compare);
}

export function countActive(f: PlaceFilters): number {
  return [f.status !== 'all', f.categoryId != null, f.zone != null, f.showArchived, f.onlyWithLocation].filter(Boolean).length;
}
