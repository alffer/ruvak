// Separa una hoja de marca con varios dibujos (fondo blanco o casi transparente) en piezas PNG con transparencia.
// Uso: node scripts/split-brand-sheet.mjs <archivo-en-originales> <carpeta-de-salida> [tamaño-minimo-px]
// Quita el fondo que está conectado con el borde, y después separa cada dibujo por componentes conexas.
// Las piezas salen numeradas por filas (de arriba abajo, de izquierda a derecha) para poder nombrarlas.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [, , src, outDir, minArg] = process.argv;
if (!src || !outDir) {
  console.error('Uso: node scripts/split-brand-sheet.mjs <archivo> <salida> [min]');
  process.exit(1);
}
const MIN = Number(minArg || 400);
const input = src.startsWith('/') ? src : join(ROOT, 'assets/ruvak/originales', src);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (i) => i * 4;

// 1) Fondo: píxeles transparentes o casi blancos/grises claros, alcanzables desde el borde.
const isBgPixel = (i) => {
  const o = px(i);
  const r = data[o], g = data[o + 1], b = data[o + 2], a = data[o + 3];
  if (a < 40) return true;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx > 232 && mx - mn < 22;
};
const bg = new Uint8Array(W * H);
const stack = [];
const push = (i) => { if (!bg[i] && isBgPixel(i)) { bg[i] = 1; stack.push(i); } };
for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
while (stack.length) {
  const i = stack.pop();
  const x = i % W, y = (i / W) | 0;
  if (x > 0) push(i - 1);
  if (x < W - 1) push(i + 1);
  if (y > 0) push(i - W);
  if (y < H - 1) push(i + W);
}

// 2) Componentes conexas del primer plano (8 vecinos).
const label = new Int32Array(W * H).fill(-1);
const comps = [];
for (let s = 0; s < W * H; s++) {
  if (bg[s] || label[s] !== -1) continue;
  const id = comps.length;
  const q = [s];
  label[s] = id;
  let minX = W, minY = H, maxX = 0, maxY = 0, area = 0;
  while (q.length) {
    const i = q.pop();
    const x = i % W, y = (i / W) | 0;
    area++;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (bg[j] || label[j] !== -1) continue;
      label[j] = id;
      q.push(j);
    }
  }
  comps.push({ id, area, minX, minY, maxX, maxY });
}
const keep = comps.filter((c) => c.area >= MIN).sort((a, b) => {
  const rowA = Math.round(a.minY / 120), rowB = Math.round(b.minY / 120);
  return rowA !== rowB ? rowA - rowB : a.minX - b.minX;
});

// 3) Una pieza por componente: solo su propio dibujo, con transparencia.
mkdirSync(outDir, { recursive: true });
const pad = 6;
for (let k = 0; k < keep.length; k++) {
  const c = keep[k];
  const x0 = Math.max(0, c.minX - pad), y0 = Math.max(0, c.minY - pad);
  const w = Math.min(W, c.maxX + pad + 1) - x0, h = Math.min(H, c.maxY + pad + 1) - y0;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (y0 + y) * W + (x0 + x);
    const o = (y * w + x) * 4;
    const mine = label[si] === c.id;
    out[o] = data[px(si)]; out[o + 1] = data[px(si) + 1]; out[o + 2] = data[px(si) + 2];
    out[o + 3] = mine ? data[px(si) + 3] : 0;
  }
  const name = `${basename(src, '.webp')}-${String(k + 1).padStart(2, '0')}.webp`;
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(join(outDir, name));
}
console.log(`${keep.length} piezas en ${outDir} (descartadas ${comps.length - keep.length} manchas pequeñas)`);
