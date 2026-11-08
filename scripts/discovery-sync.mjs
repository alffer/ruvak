// Busca novedades de Gijón en fuentes RSS y las guarda como BORRADORES en Supabase (published = false).
// Nunca publica nada: la publicación la decide la persona editorial desde el panel de administración.
// Ejecutar: node scripts/discovery-sync.mjs   (lo lanza el workflow .github/workflows/discovery-sync.yml)
//
// Variables de entorno:
//   EXPO_PUBLIC_SUPABASE_URL          URL del proyecto de Supabase
//   SUPABASE_SERVICE_ROLE_KEY         clave service_role (SOLO en GitHub Secrets, nunca en la app)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Palabras que indican una apertura o un local nuevo. Es un filtro de partida: la revisión humana es la que decide.
const KEYWORDS = /\b(apertura|abre|abrirá|abrirán|abre sus puertas|nuevo local|nueva apertura|inaugura|se estrena|llega a gijón|primer local)\b/i;

if (!SUPABASE_URL || !KEY) {
  console.log('discovery-sync: falta SUPABASE_SERVICE_ROLE_KEY o la URL de Supabase. No se hace nada.');
  process.exit(0);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (block, name) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block);
  return m ? decode(m[1]) : '';
};

async function fetchFeed(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'RUVAK-novedades/1.0 (uso editorial no comercial)' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseItems(xml) {
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map(([block]) => ({
    title: tag(block, 'title'),
    link: tag(block, 'link'),
    summary: tag(block, 'description').slice(0, 300),
    date: tag(block, 'pubDate'),
  }));
}

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const config = JSON.parse(readFileSync(join(ROOT, 'scripts/discovery-feeds.json'), 'utf8'));
const [city] = await rest('cities?select=id&slug=eq.gijon');
if (!city) throw new Error('No existe la ciudad Gijón en la base de datos.');

const existing = new Set((await rest('discovery_items?select=source_url')).map((r) => r.source_url).filter(Boolean));
let nuevos = 0;

for (const fuente of config.fuentes) {
  let items;
  try {
    items = parseItems(await fetchFeed(fuente.url));
  } catch (e) {
    console.log(`✘ ${fuente.nombre}: no disponible (${e.message}). Se salta.`);
    continue;
  }
  const candidatos = items.filter((i) => i.link && KEYWORDS.test(`${i.title} ${i.summary}`));
  console.log(`· ${fuente.nombre}: ${items.length} entradas, ${candidatos.length} posibles novedades`);
  for (const c of candidatos) {
    if (existing.has(c.link)) continue;
    await rest('discovery_items', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        city_id: city.id,
        kind: 'announced',
        title: c.title.slice(0, 180),
        summary: c.summary || `Noticia de ${fuente.nombre}${c.date ? ` (${c.date})` : ''}. Pendiente de verificar.`,
        verification: 'unverified',
        source_name: fuente.nombre,
        source_url: c.link,
        published: false,
      }),
    });
    existing.add(c.link);
    nuevos++;
  }
}
console.log(`discovery-sync: ${nuevos} borradores nuevos. Nada se ha publicado.`);
