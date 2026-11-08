/// <reference types="node" />
// Comprobación de src/lib/urlParse.ts (URLs compartidas). Ejecutar: npx tsx scripts/check-url.ts
import assert from 'node:assert/strict';
import { coerceUrl, normalizeUrl, parseSharedUrl } from '../src/lib/urlParse';

// ---- Validación
assert.equal(coerceUrl(''), null);
assert.equal(coerceUrl('hola'), null);
assert.equal(coerceUrl('javascript:alert(1)'), null);
assert.equal(coerceUrl('ftp://example.com')?.href ?? null, null);
assert.equal(coerceUrl('example.com/a')?.href, 'https://example.com/a');

// ---- Normalización: sin www, protocolo, seguimiento ni barra final
assert.equal(normalizeUrl('https://www.example.com/cafe/?utm_source=x&b=2&a=1'), 'example.com/cafe?a=1&b=2');
assert.equal(normalizeUrl('http://example.com/cafe'), normalizeUrl('https://www.example.com/cafe/'));
assert.equal(normalizeUrl('https://www.instagram.com/p/ABC/?igsh=xyz'), 'instagram.com/p/ABC');

// ---- Redes sociales: tipo detectado, sin inventar nombre ni coordenadas
const ig = parseSharedUrl('https://www.instagram.com/reel/XYZ/?igsh=1');
assert.equal(ig?.sourceType, 'instagram');
assert.equal(ig?.name, null);
assert.equal(ig?.lat, null);
assert.equal(parseSharedUrl('https://vm.tiktok.com/ZGabc/')?.sourceType, 'tiktok');
assert.equal(parseSharedUrl('https://blog.example.org/gijon')?.sourceType, 'url');

// ---- Google Maps /place/ con nombre, coordenadas del lugar (!3d!4d) e id hexadecimal
const gm = parseSharedUrl(
  'https://www.google.com/maps/place/Caf%C3%A9+Dindurra/@43.5390,-5.6600,17z/data=!4m6!3m5!1s0xd367c9a1b2c3d4e5:0x1a2b3c4d5e6f7a8b!8m2!3d43.5391!4d-5.6612',
);
assert.equal(gm?.sourceType, 'google_maps');
assert.equal(gm?.name, 'Café Dindurra');
assert.equal(gm?.lat, 43.5391); // la del lugar, no la de la vista (@)
assert.equal(gm?.lng, -5.6612);
assert.equal(gm?.externalId, 'gmaps:ftid:0xd367c9a1b2c3d4e5:0x1a2b3c4d5e6f7a8b');

// ---- cid de Takeout
const cid = parseSharedUrl('http://maps.google.com/?cid=1234567890');
assert.equal(cid?.externalId, 'gmaps:cid:1234567890');
assert.equal(cid?.lat, null);

// ---- Enlace corto: no se puede leer sin abrirlo; no se inventa nada
const short = parseSharedUrl('https://maps.app.goo.gl/AbCdEf');
assert.equal(short?.sourceType, 'google_maps');
assert.equal(short?.name, null);
assert.equal(short?.externalId, null);

// ---- Búsqueda por coordenadas: no es un nombre
const q = parseSharedUrl('https://www.google.com/maps/search/?api=1&query=43.54,-5.66');
assert.equal(q?.name, null);
assert.equal(q?.lat, 43.54);

console.log('check-url: OK');
