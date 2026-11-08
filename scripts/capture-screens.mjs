// Capturas de las pantallas con datos de ejemplo, sin proyecto de Supabase: el navegador responde
// a las llamadas de Supabase con los datos de abajo (solo para revisar el diseño).
//
//   EXPO_PUBLIC_SUPABASE_URL=https://demo.supabase.co EXPO_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key-para-capturas-0000 \
//     npx expo export --platform web --output-dir dist-web
//   node scripts/capture-screens.mjs            # → docs/capturas/*.png
//
// Usa Playwright (require('playwright')) y Chromium ya instalados en el sistema.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const DIST = join(ROOT, 'dist-web');
const OUT = join(ROOT, 'docs', 'capturas');
mkdirSync(OUT, { recursive: true });

// ---- Datos de ejemplo (coinciden con supabase/seed.sql; los lugares privados son inventados y se ven como tales) ----
const UID = '00000000-0000-0000-0000-0000000000aa';
const now = '2026-11-07T10:00:00Z';
const cities = [{ id: 1, name: 'Gijón', slug: 'gijon', country_code: 'ES', region: 'Asturias', center_lat: 43.5357, center_lng: -5.6615, zoom: 13 }];
const categories = [
  'Cafeterías',
  'Restaurantes',
  'Bares y sidrerías',
  'Tiendas independientes',
  'Librerías',
  'Espacios culturales',
  'Museos',
  'Exposiciones',
  'Mercados y mercadillos',
  'Talleres',
  'Parques y naturaleza',
  'Playas',
  'Miradores y paseos',
  'Otros',
].map((name, i) => ({ id: i + 1, name, slug: name.toLowerCase() }));
const place = (id, name, category_id, zone, lat, lng, extra = {}) => ({
  id,
  owner_id: null,
  name,
  name_key: name.toLowerCase(),
  description: null,
  category_id,
  address: null,
  zone,
  city_id: 1,
  lat,
  lng,
  phone: null,
  website: null,
  image_url: null,
  image_credit: null,
  archived: false,
  created_at: now,
  updated_at: now,
  ...extra,
});
const editorial = [
  place(1, 'Elogio del Horizonte', 13, 'Cimavilla', 43.547, -5.663, { description: 'Escultura de Eduardo Chillida en lo alto del Cerro de Santa Catalina.' }),
  place(2, 'Termas romanas de Campo Valdés', 7, 'Cimavilla', 43.545, -5.6612),
  place(4, 'Universidad Laboral', 6, 'Cabueñes', 43.524, -5.614),
  place(5, 'Jardín Botánico Atlántico', 11, 'Cabueñes', 43.5225, -5.618),
  place(7, 'Museo del Ferrocarril de Asturias', 7, 'Calzada', 43.5402, -5.672),
];
const mine = [
  place(101, 'Cafetería de ejemplo', 1, 'Centro', 43.5405, -5.6602, { owner_id: UID, address: 'Calle de ejemplo, 1' }),
  place(102, 'Librería de ejemplo', 5, 'La Arena', 43.5372, -5.6488, { owner_id: UID }),
  place(103, 'Sidrería vista en TikTok', 3, null, null, null, { owner_id: UID }),
];
const userPlaces = [
  {
    user_id: UID,
    place_id: 101,
    status: 'visited',
    favorite: true,
    note: 'Buen sitio para trabajar por la mañana.',
    tags: ['wifi'],
    saved_at: '2026-11-01T10:00:00Z',
    visited_at: '2026-11-03T10:00:00Z',
  },
  { user_id: UID, place_id: 102, status: 'pending', favorite: false, note: '', tags: [], saved_at: '2026-11-04T10:00:00Z', visited_at: null },
  {
    user_id: UID,
    place_id: 103,
    status: 'pending',
    favorite: false,
    note: 'Me la recomendaron en un vídeo.',
    tags: [],
    saved_at: '2026-11-05T10:00:00Z',
    visited_at: null,
  },
  { user_id: UID, place_id: 1, status: null, favorite: true, note: '', tags: [], saved_at: '2026-11-06T10:00:00Z', visited_at: null },
];
const allPlaces = [...editorial, ...mine];
const byId = (id) => allPlaces.find((p) => p.id === id);
const collections = [{ id: 10, user_id: UID, name: 'Cafés para trabajar', created_at: now, collection_places: [{ count: 1 }] }];
const collectionPlaces = [{ collection_id: 10, place_id: 101 }];
const discovery = [
  [1, 1, 'featured', 'Atardecer en el Cerro de Santa Catalina', 'Sube a la escultura de Chillida y recorre el cerro. Aquí tienes una pista por Cimavilla.'],
  [2, 2, 'recommended', 'Gijón romano bajo la plaza', 'Unas termas romanas en pleno barrio alto. Esto merece una visita.'],
  [3, 4, 'featured', 'Arquitectura monumental en Cabueñes', 'Un conjunto enorme para recorrer con calma.'],
  [4, 5, 'plan', 'Plan verde en Cabueñes', 'Combina el Jardín Botánico con la Universidad Laboral, que está al lado.'],
].map(([id, pid, kind, title, summary]) => ({
  id,
  city_id: 1,
  place_id: pid,
  place: byId(pid),
  kind,
  title,
  summary,
  image_url: null,
  image_credit: null,
  verification: 'unverified',
  source_name: 'Datos de ejemplo de RUVAK (pendiente de verificar)',
  source_url: null,
  verified_at: null,
  published: true,
  created_at: now,
  updated_at: now,
}));
const sources = [
  {
    id: 1,
    place_id: 101,
    owner_id: UID,
    source_type: 'tiktok',
    url: 'https://www.tiktok.com/@ejemplo/video/1',
    label: 'tiktok.com',
    checked_at: null,
    created_at: now,
  },
  {
    id: 2,
    place_id: 1,
    owner_id: null,
    source_type: 'editorial',
    url: null,
    label: 'Datos de ejemplo de RUVAK · coordenadas aproximadas',
    checked_at: now,
    created_at: now,
  },
];

function eqParam(url, name) {
  const v = url.searchParams.get(name);
  return v && v.startsWith('eq.') ? v.slice(3) : null;
}

function rest(table, url) {
  const id = eqParam(url, 'id');
  const placeId = eqParam(url, 'place_id');
  switch (table) {
    case 'cities':
      return cities;
    case 'categories':
      return categories;
    case 'profiles':
      return [{ id: UID, display_name: 'Lucía', home_city_id: 1, role: 'admin', personalization_enabled: true, onboarded: true, created_at: now }];
    case 'user_interests':
      return [{ category_id: 7 }, { category_id: 13 }];
    case 'user_places': {
      const rows = userPlaces.map((u) => ({ ...u, place: byId(u.place_id) }));
      return placeId ? rows.filter((r) => String(r.place_id) === placeId) : rows;
    }
    case 'collection_places':
      return placeId ? collectionPlaces.filter((r) => String(r.place_id) === placeId) : collectionPlaces;
    case 'collections':
      return collections;
    case 'discovery_items':
      return discovery;
    case 'hidden_discovery':
      return [];
    case 'place_sources':
      return placeId ? sources.filter((s) => String(s.place_id) === placeId) : sources;
    case 'places': {
      if (id) return allPlaces.filter((p) => String(p.id) === id);
      if (url.searchParams.get('owner_id') === 'is.null') return editorial;
      return allPlaces.map((p) => ({ ...p, place_sources: [] }));
    }
    default:
      return [];
  }
}

// ---- Servidor estático con vuelta a index.html (salida «single») ----
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(8087, r));

const session = {
  access_token: 'demo',
  refresh_token: 'demo',
  token_type: 'bearer',
  expires_in: 360000,
  expires_at: Math.floor(Date.now() / 1000) + 360000,
  user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'lucia@example.com', app_metadata: {}, user_metadata: {}, created_at: now },
};

const SHOTS = [
  ['01-inicio', '/'],
  ['02-descubrir', '/descubrir'],
  ['03-mapa', '/mapa'],
  ['04-mis-lugares', '/lugares'],
  ['05-ficha', '/lugar/101'],
  ['06-ficha-editorial', '/lugar/1'],
  ['07-nuevo-lugar', '/lugar/nuevo'],
  ['08-importar', '/importar'],
  ['09-perfil', '/perfil'],
  ['10-admin', '/admin'],
  ['11-viajes', '/viajes'],
];
// [sufijo, tamaño, tema]: móvil en oscuro y claro, escritorio en oscuro.
const VIEWPORTS = [
  ['movil', { width: 390, height: 844 }, 'dark'],
  ['movil-claro', { width: 390, height: 844 }, 'light'],
  ['escritorio', { width: 1280, height: 860 }, 'dark'],
];

const browser = await chromium.launch();
const problems = [];
for (const [vpName, viewport, theme] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(
    ([s, t]) => {
      localStorage.setItem('sb-demo-auth-token', JSON.stringify(s));
      localStorage.setItem('ruvak:tema', t);
    },
    [session, theme],
  );
  await ctx.route('https://demo.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    const m = /^\/rest\/v1\/([a-z_]+)/.exec(url.pathname);
    if (!m) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    const rows = rest(m[1], url);
    const single = (route.request().headers().accept ?? '').includes('vnd.pgrst.object');
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single ? (rows[0] ?? null) : rows) });
  });
  // Teselas: un gris liso (sin red hacia OpenStreetMap en las capturas).
  await ctx.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 404, body: '' }));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${vpName} pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && problems.push(`${vpName} console: ${m.text()}`));
  for (const [name, path] of SHOTS) {
    await page.goto(`http://localhost:8087${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    if (path === '/mapa') {
      // Abre el panel de un marcador para ver la ficha resumida.
      const marker = page.locator('.leaflet-marker-icon').first();
      if (await marker.count()) await marker.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: join(OUT, `${name}-${vpName}.png`), fullPage: false });
  }
  if (vpName === 'movil') {
    // Prueba de humo: en móvil el botón de perfil de la cabecera tiene que llevar al Perfil (y no redirigir a Inicio).
    await page.goto('http://localhost:8087/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Perfil y ajustes' }).click();
    await page.waitForTimeout(600);
    const ok = page.url().endsWith('/perfil') && (await page.getByText('Apariencia').count()) > 0;
    if (!ok) problems.push(`movil: el botón de perfil no lleva al Perfil (url: ${page.url()})`);
  }
  await ctx.close();
}
await browser.close();
server.close();
if (problems.length) {
  console.log('Problemas:\n' + [...new Set(problems)].join('\n'));
  process.exitCode = 1;
} else console.log(`Capturas en ${OUT}`);
