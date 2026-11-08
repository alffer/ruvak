/// <reference types="node" />
// Comprobación de src/lib/filters.ts (búsqueda y filtros). Ejecutar: npx tsx scripts/check-filters.ts
import assert from 'node:assert/strict';
import { EMPTY_FILTERS, filterPlaces, inSmartList, sortPlaces, zonesOf, type PlaceFilters } from '../src/lib/filters';
import type { SavedPlace } from '../src/lib/types';

let n = 0;
function place(p: Partial<SavedPlace> & { name: string }, me: Partial<SavedPlace['me']> = {}, collectionIds: number[] = []): SavedPlace {
  n++;
  return {
    id: n,
    nameKey: '',
    description: null,
    categoryId: null,
    address: null,
    zone: null,
    cityId: 1,
    lat: null,
    lng: null,
    phone: null,
    website: null,
    imageUrl: null,
    imageCredit: null,
    isEditorial: false,
    archived: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...p,
    me: { status: null, favorite: false, note: '', tags: [], savedAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00Z`, visitedAt: null, ...me },
    collectionIds,
  };
}

const cats: Record<number, string> = { 1: 'Cafeterías', 2: 'Librerías' };
const catName = (id: number | null) => (id == null ? null : (cats[id] ?? null));

const all = [
  place({ name: 'Café Dindurra', categoryId: 1, zone: 'Centro', lat: 43.5, lng: -5.6 }, { status: 'visited', favorite: true }),
  place({ name: 'Librería Paradiso', categoryId: 2, zone: 'Cimavilla' }, { status: 'pending', note: 'preguntar por fanzines' }, [10]),
  place({ name: 'Sitio descartado', zone: 'centro' }, { status: 'discarded' }),
  place({ name: 'Antiguo bar', archived: true }),
  place({ name: 'Otra ciudad', cityId: 2 }, { tags: ['viaje'] }),
];
const f = (patch: Partial<PlaceFilters>) => filterPlaces(all, { ...EMPTY_FILTERS, ...patch }, catName).map((p) => p.name);

// Por defecto: sin archivados ni descartados.
assert.deepEqual(f({}), ['Café Dindurra', 'Librería Paradiso', 'Otra ciudad']);
// Búsqueda sin tildes, en nombre, categoría, zona y NOTA privada.
assert.deepEqual(f({ q: 'cafe' }), ['Café Dindurra']);
assert.deepEqual(f({ q: 'librerias' }), ['Librería Paradiso']);
assert.deepEqual(f({ q: 'fanzines' }), ['Librería Paradiso']);
assert.deepEqual(f({ q: 'CIMAVILLA paradiso' }), ['Librería Paradiso']);
assert.deepEqual(f({ q: 'viaje' }), ['Otra ciudad']); // etiquetas
assert.deepEqual(f({ q: 'nada que ver' }), []);
// Estados
assert.deepEqual(f({ status: 'pending' }), ['Librería Paradiso']);
assert.deepEqual(f({ status: 'favorites' }), ['Café Dindurra']);
assert.deepEqual(f({ status: 'discarded' }), ['Sitio descartado']);
assert.deepEqual(f({ status: 'none' }), ['Otra ciudad']);
// Categoría, lista, ciudad y zona (insensible a mayúsculas)
assert.deepEqual(f({ categoryId: 2 }), ['Librería Paradiso']);
assert.deepEqual(f({ collectionId: 10 }), ['Librería Paradiso']);
assert.deepEqual(f({ cityId: 1 }), ['Café Dindurra', 'Librería Paradiso']);
assert.deepEqual(f({ zone: 'Centro', status: 'discarded' }), ['Sitio descartado']);
assert.deepEqual(f({ onlyWithLocation: true }), ['Café Dindurra']);
assert.deepEqual(f({ showArchived: true }).includes('Antiguo bar'), true);
// Listas sugeridas = estados
assert.deepEqual(f({ smart: 'visited' }), ['Café Dindurra']);
assert.equal(inSmartList(all[0], 'favorites'), true);
// Orden
assert.deepEqual(
  sortPlaces(all.slice(0, 2), 'recent').map((p) => p.name),
  ['Librería Paradiso', 'Café Dindurra'],
);
assert.deepEqual(
  sortPlaces([all[1], all[3], all[0]], 'name').map((p) => p.name),
  ['Antiguo bar', 'Café Dindurra', 'Librería Paradiso'],
);
// Zonas sin duplicar por mayúsculas
assert.deepEqual(zonesOf(all), ['Centro', 'Cimavilla']);

console.log('check-filters: OK');
