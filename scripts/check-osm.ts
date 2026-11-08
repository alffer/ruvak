/// <reference types="node" />
// Comprobación de src/lib/osm.ts (lógica pura, sin red). Ejecutar: npx tsx scripts/check-osm.ts
import assert from 'node:assert/strict';
import { categorySlugFromTags, formatAddress, normalizeName, osmSource, pickNamedPoi } from '../src/lib/osm';

// ---- Nombres: sin acentos, mayúsculas ni signos
assert.equal(normalizeName('Café «La Estación»'), 'cafe la estacion');
assert.equal(normalizeName('  Sidrería  El   Tragón '), 'sidreria el tragon');
assert.equal(normalizeName('Ñoño, S.L.'), 'nono s l');

// ---- Categorías: solo lo inequívoco
assert.equal(categorySlugFromTags({ amenity: 'cafe' }), 'cafeterias');
assert.equal(categorySlugFromTags({ amenity: 'restaurant', cuisine: 'asturian' }), 'restaurantes');
assert.equal(categorySlugFromTags({ amenity: 'bar' }), 'bares');
assert.equal(categorySlugFromTags({ shop: 'books' }), 'librerias');
assert.equal(categorySlugFromTags({ shop: 'clothes' }), 'tiendas');
assert.equal(categorySlugFromTags({ tourism: 'museum' }), 'museos');
assert.equal(categorySlugFromTags({ craft: 'carpenter' }), 'talleres');
assert.equal(categorySlugFromTags({ amenity: 'bench' }), null, 'un banco no es una categoría de RUVAK');
assert.equal(categorySlugFromTags({ building: 'yes' }), null);

// ---- Dirección: sin calle no se inventa
assert.equal(formatAddress({ road: 'Calle Corrida', house_number: '12', postcode: '33201', city: 'Gijón' }), 'Calle Corrida 12, 33201 Gijón');
assert.equal(formatAddress({ road: 'Calle Corrida', town: 'Gijón' }), 'Calle Corrida, Gijón');
assert.equal(formatAddress({ city: 'Gijón', postcode: '33201' }), null, 'sin calle no hay dirección fiable');
assert.equal(formatAddress({ pedestrian: 'Calle Peatonal', house_number: '3', village: 'Cenero' }), 'Calle Peatonal 3, Cenero');

// ---- Coincidencia de POI: exacta tras normalizar; si no coincide, nada
const pois = [
  { tags: { name: 'Bar Pepe', amenity: 'bar' } },
  { tags: { name: 'Café La Estación', amenity: 'cafe' } },
  { tags: { name: 'Estación de autobuses', amenity: 'bus_station' } },
];
assert.equal(pickNamedPoi(pois, 'Cafe la Estacion')?.amenity, 'cafe', 'mismo nombre sin acentos ni mayúsculas');
assert.equal(pickNamedPoi(pois, 'Estación')?.amenity ?? null, null, 'un nombre parecido no basta');
assert.equal(pickNamedPoi(pois, 'Pepe'), null, 'coincidencia parcial no vale');
assert.equal(pickNamedPoi(pois, ''), null);
assert.equal(pickNamedPoi([], 'Bar Pepe'), null);

// ---- Fuente registrada: enlace al mapa, nombre y fecha de la consulta
const src = osmSource(43.5446, -5.6626, '2026-11-08T10:00:00.000Z');
assert.equal(src.sourceType, 'other');
assert.equal(src.checkedAt, '2026-11-08T10:00:00.000Z');
assert.match(src.url ?? '', /^https:\/\/www\.openstreetmap\.org\//);

console.log('check-osm: OK');
