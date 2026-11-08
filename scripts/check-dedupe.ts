/// <reference types="node" />
// Comprobación de src/lib/dedupe.ts (posibles duplicados). Ejecutar: npx tsx scripts/check-dedupe.ts
import assert from 'node:assert/strict';
import { addressKey, distanceMeters, findDuplicates, nameKey, type DedupeCandidate } from '../src/lib/dedupe';

// ---- nameKey igual que public.ruvak_name_key() (supabase/migrations)
assert.equal(nameKey('Café Secreto de Ana'), 'cafe secreto de ana'); // mismo caso que scripts/check-rls.sql
assert.equal(nameKey('  La Galana — Sidrería! '), 'la galana sidreria');
assert.equal(nameKey('ÑANDÚ'), 'nandu');
assert.equal(addressKey('Calle Corrida, 12, 33206 Gijón, Asturias, España'), 'corrida 12 gijon');
assert.equal(addressKey('C. Corrida 12, Gijón'), 'corrida 12 gijon');

// ---- distancia
const d = distanceMeters({ lat: 43.5446, lng: -5.664 }, { lat: 43.5455, lng: -5.664 });
assert.ok(d > 95 && d < 105, `~100 m, sale ${d}`);

const base: DedupeCandidate[] = [
  { id: 1, name: 'Café Dindurra', address: 'Paseo de Begoña, 11, Gijón', lat: 43.539, lng: -5.6612, externalIds: ['gmaps:cid:111'], normalizedUrls: [] },
  { id: 2, name: 'Librería Paradiso', address: null, lat: null, lng: null, externalIds: [], normalizedUrls: ['instagram.com/p/abc'] },
  { id: 3, name: 'Panadería Sol', address: null, lat: 43.53, lng: -5.66, externalIds: [], normalizedUrls: [] },
];

// identificador externo, aunque el nombre cambie
assert.equal(findDuplicates({ name: 'Otro nombre', externalId: 'gmaps:cid:111' }, base)[0]?.reason, 'external_id');
// misma URL normalizada
assert.equal(findDuplicates({ name: 'X', normalizedUrl: 'instagram.com/p/abc' }, base)[0]?.reason, 'url');
// mismo nombre (con tildes distintas) y misma dirección escrita de otra forma
assert.equal(findDuplicates({ name: 'cafe dindurra', address: 'Pº Begoña 11, 33201 Gijón' }, base)[0]?.reason, 'name_address');
// mismo nombre y a pocos metros
assert.equal(findDuplicates({ name: 'Café Dindurra', lat: 43.5391, lng: -5.6611 }, base)[0]?.reason, 'name_location');
// mismo nombre pero a kilómetros: otra sucursal, no es duplicado
assert.equal(findDuplicates({ name: 'Panadería Sol', lat: 43.4, lng: -5.8 }, base).length, 0);
// mismo nombre sin datos para distinguir: se avisa para que la persona decida
assert.equal(findDuplicates({ name: 'Librería Paradiso' }, base)[0]?.reason, 'name');
// nada en común
assert.equal(findDuplicates({ name: 'Museo Nuevo', address: 'Calle Falsa 1' }, base).length, 0);
// orden: el motivo más fuerte primero
const many = findDuplicates({ name: 'Librería Paradiso', normalizedUrl: 'instagram.com/p/abc', externalId: 'gmaps:cid:111' }, base);
assert.deepEqual(
  many.map((m) => m.reason),
  ['external_id', 'url'],
);

console.log('check-dedupe: OK');
