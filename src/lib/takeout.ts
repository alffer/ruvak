// Lector de archivos de Google Takeout (puro; comprobado por scripts/check-takeout.ts).
// RF-04: solo lee el archivo, nunca lo modifica. Formatos admitidos (pendientes de validar
// con exportaciones reales, ver docs/pendiente.md):
//   · «Saved Places.json» / «Labeled places.json» (Maps — Tus sitios): GeoJSON FeatureCollection,
//     tanto el formato nuevo (properties.location.name) como el antiguo (properties.Location["Business Name"]).
//   · Listas guardadas de «Saved/*.csv»: columnas Title, Note, URL (Tags y Comment opcionales).
import { googleMapsCoords, googleMapsExternalId, normalizeUrl, coerceUrl } from './urlParse';

export interface ImportCandidate {
  index: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  url: string | null;
  normalizedUrl: string | null;
  externalId: string | null;
  note: string | null;
  listName: string | null;
  savedAt: string | null;
  /** Avisos legibles: datos que faltan. No impiden importar. */
  problems: string[];
}

export interface ImportParseResult {
  format: 'geojson' | 'csv';
  items: ImportCandidate[];
  /** Registros que no se pueden importar (sin nombre, dirección ni enlace), con su motivo. */
  omitted: { row: number; reason: string }[];
}

export class ImportFormatError extends Error {}

const str = (v: unknown): string | null => {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v).trim();
  return s ? s : null;
};

function finish(partial: Omit<ImportCandidate, 'problems' | 'index' | 'normalizedUrl' | 'externalId'>, index: number): ImportCandidate {
  const u = partial.url ? coerceUrl(partial.url) : null;
  let { lat, lng } = partial;
  if ((lat == null || lng == null) && u) {
    const c = googleMapsCoords(u.href);
    if (c) ({ lat, lng } = c);
  }
  const problems: string[] = [];
  if (lat == null || lng == null) problems.push('Sin coordenadas: no saldrá en el mapa');
  if (!partial.address) problems.push('Sin dirección');
  return {
    ...partial,
    index,
    lat,
    lng,
    url: u?.href ?? null,
    normalizedUrl: u ? normalizeUrl(u.href) : null,
    externalId: u ? googleMapsExternalId(u) : null,
    problems,
  };
}

function validCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a === 0 && b === 0) return null; // Takeout usa [0,0] cuando no hay coordenadas
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

export function parseGeoJson(text: string): ImportParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportFormatError('El archivo no es un JSON válido.');
  }
  const features = (data as { features?: unknown }).features;
  if (!Array.isArray(features)) throw new ImportFormatError('El JSON no tiene la forma de «Saved Places.json» (falta «features»).');
  const items: ImportCandidate[] = [];
  const omitted: ImportParseResult['omitted'] = [];
  features.forEach((f, row) => {
    const props = ((f as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<string, unknown>;
    const loc = (props.location ?? props.Location ?? {}) as Record<string, unknown>;
    const geo = (loc['Geo Coordinates'] ?? {}) as Record<string, unknown>;
    const coords = (f as { geometry?: { coordinates?: unknown[] } })?.geometry?.coordinates;
    const fromGeometry = Array.isArray(coords) ? validCoords(coords[1], coords[0]) : null;
    const fromLegacy = validCoords(geo.Latitude, geo.Longitude);
    const name = str(loc.name) ?? str(loc['Business Name']) ?? str(props.name) ?? str(props.Title);
    const address = str(loc.address) ?? str(loc.Address) ?? str(props.address);
    const url = str(props.google_maps_url) ?? str(props['Google Maps URL']);
    const note = str(props.Comment) ?? str(props.comment);
    const savedAt = str(props.date) ?? str(props.Published) ?? str(props.Updated);
    const finalName = name ?? address;
    if (!finalName && !url) {
      omitted.push({ row: row + 1, reason: 'Sin nombre, dirección ni enlace' });
      return;
    }
    const c = finish(
      {
        name: finalName ?? 'Lugar sin nombre',
        address,
        lat: (fromGeometry ?? fromLegacy)?.lat ?? null,
        lng: (fromGeometry ?? fromLegacy)?.lng ?? null,
        url,
        note,
        listName: null,
        savedAt,
      },
      items.length,
    );
    if (!name) c.problems.unshift(address ? 'Sin nombre: se usa la dirección' : 'Sin nombre');
    items.push(c);
  });
  return { format: 'geojson', items, omitted };
}

/** CSV con comillas dobles (RFC 4180). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseSavedListCsv(text: string, fileName: string): ImportParseResult {
  const rows = parseCsvRows(text);
  const headerIdx = rows.findIndex((r) => r.some((c) => c.trim().toLowerCase() === 'title') && r.some((c) => c.trim().toLowerCase() === 'url'));
  if (headerIdx < 0) throw new ImportFormatError('El CSV no tiene las columnas «Title» y «URL» de una lista guardada de Google Maps.');
  const header = rows[headerIdx].map((c) => c.trim().toLowerCase());
  const col = (r: string[], name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? str(r[i]) : null;
  };
  const listName =
    fileName
      .replace(/\.csv$/i, '')
      .replace(/^.*[\\/]/, '')
      .trim() || 'Lista importada';
  const items: ImportCandidate[] = [];
  const omitted: ImportParseResult['omitted'] = [];
  rows.slice(headerIdx + 1).forEach((r, i) => {
    if (r.every((c) => !c.trim())) return; // filas vacías del propio formato
    const name = col(r, 'title');
    const url = col(r, 'url');
    if (!name && !url) {
      omitted.push({ row: headerIdx + i + 2, reason: 'Sin nombre ni enlace' });
      return;
    }
    const note = [col(r, 'note'), col(r, 'comment')].filter(Boolean).join(' · ') || null;
    const c = finish({ name: name ?? 'Lugar sin nombre', address: null, lat: null, lng: null, url, note, listName, savedAt: null }, items.length);
    if (!name) c.problems.unshift('Sin nombre');
    items.push(c);
  });
  return { format: 'csv', items, omitted };
}

export function parseTakeoutFile(fileName: string, text: string): ImportParseResult {
  if (/\.csv$/i.test(fileName)) return parseSavedListCsv(text, fileName);
  if (/\.(geo)?json$/i.test(fileName)) return parseGeoJson(text);
  const t = text.trimStart();
  if (t.startsWith('{')) return parseGeoJson(text);
  return parseSavedListCsv(text, fileName);
}
