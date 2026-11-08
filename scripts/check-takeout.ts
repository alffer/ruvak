/// <reference types="node" />
// Comprobación de src/lib/takeout.ts (importar Google Takeout). Ejecutar: npx tsx scripts/check-takeout.ts
// Los ejemplos imitan el formato documentado; hay que validarlos con exportaciones reales (docs/pendiente.md).
import assert from 'node:assert/strict';
import { ImportFormatError, parseCsvRows, parseTakeoutFile } from '../src/lib/takeout';

// ---- «Saved Places.json», formato actual
const geo = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.6612, 43.5391] },
      properties: {
        date: '2024-05-01T10:00:00Z',
        google_maps_url: 'http://maps.google.com/?cid=111',
        location: { name: 'Café Dindurra', address: 'Paseo de Begoña, 11, Gijón', country_code: 'ES' },
      },
    },
    // sin coordenadas ([0,0]) y sin nombre: se usa la dirección
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { google_maps_url: 'http://maps.google.com/?cid=222', location: { address: 'Calle Corrida, 1, Gijón' } },
    },
    // vacío: se omite y se informa
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
    // con comentario
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.66, 43.54] },
      properties: { Comment: 'Probar la tarta', location: { name: 'Pastelería X' } },
    },
  ],
});
const original = geo;
const r1 = parseTakeoutFile('Saved Places.json', geo);
assert.equal(geo, original); // no modifica la entrada
assert.equal(r1.format, 'geojson');
assert.equal(r1.items.length, 3);
assert.deepEqual(r1.omitted, [{ row: 3, reason: 'Sin nombre, dirección ni enlace' }]);
assert.equal(r1.items[0].name, 'Café Dindurra');
assert.equal(r1.items[0].lat, 43.5391);
assert.equal(r1.items[0].lng, -5.6612);
assert.equal(r1.items[0].externalId, 'gmaps:cid:111');
assert.equal(r1.items[0].savedAt, '2024-05-01T10:00:00Z');
assert.deepEqual(r1.items[0].problems, []);
assert.equal(r1.items[1].name, 'Calle Corrida, 1, Gijón');
assert.equal(r1.items[1].lat, null);
assert.ok(r1.items[1].problems.includes('Sin nombre: se usa la dirección'));
assert.ok(r1.items[1].problems.some((p) => p.startsWith('Sin coordenadas')));
assert.equal(r1.items[2].note, 'Probar la tarta');
assert.ok(r1.items[2].problems.includes('Sin dirección'));

// ---- «Saved Places.json», formato antiguo
const legacy = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5.664, 43.5446] },
      properties: {
        Title: 'Plaza Mayor',
        'Google Maps URL': 'http://maps.google.com/?cid=333',
        Location: { Address: 'Plaza Mayor, Gijón', 'Business Name': 'Plaza Mayor de Gijón', 'Geo Coordinates': { Latitude: '43.5446', Longitude: '-5.664' } },
        Published: '2019-01-01T00:00:00Z',
      },
    },
  ],
});
const r2 = parseTakeoutFile('Saved Places.json', legacy);
assert.equal(r2.items[0].name, 'Plaza Mayor de Gijón');
assert.equal(r2.items[0].address, 'Plaza Mayor, Gijón');
assert.equal(r2.items[0].externalId, 'gmaps:cid:333');

// ---- CSV de lista guardada («Saved/Quiero ir.csv»)
const csv = [
  'Title,Note,URL,Tags,Comment',
  ',,,,',
  '"Sidrería ""La Galana""",para el sábado,https://www.google.com/maps/place/La+Galana/data=!4m2!3m1!1s0xd367:0xabc!3d43.5448!4d-5.6627,,',
  'Librería Paradiso,,https://www.google.com/maps/place/Paradiso/data=!4m2!3m1!1s0xd368:0xdef,,"con, coma"',
  ',,,,',
  'Sin enlace,,,,',
  ',solo nota,,,',
  '',
].join('\r\n');
const r3 = parseTakeoutFile('Quiero ir.csv', '﻿' + csv);
assert.equal(r3.format, 'csv');
assert.equal(r3.items.length, 3);
assert.equal(r3.omitted.length, 1); // la fila con solo nota
assert.equal(r3.items[0].name, 'Sidrería "La Galana"');
assert.equal(r3.items[0].note, 'para el sábado');
assert.equal(r3.items[0].listName, 'Quiero ir');
assert.equal(r3.items[0].lat, 43.5448); // sacadas de la URL
assert.equal(r3.items[0].externalId, 'gmaps:ftid:0xd367:0xabc');
assert.equal(r3.items[1].note, 'con, coma');
assert.equal(r3.items[1].lat, null);
assert.equal(r3.items[2].url, null);

// ---- Errores de formato claros
assert.throws(() => parseTakeoutFile('x.json', '{"foo":1}'), ImportFormatError);
assert.throws(() => parseTakeoutFile('x.json', 'no es json'), ImportFormatError);
assert.throws(() => parseTakeoutFile('x.csv', 'a,b\n1,2'), ImportFormatError);
assert.deepEqual(parseCsvRows('a,"b\nc"\n'), [['a', 'b\nc']]);

console.log('check-takeout: OK');
