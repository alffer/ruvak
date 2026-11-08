// Genera los assets de RUVAK desde los originales de assets/ruvak/originales (que no se tocan).
// Ejecutar: node scripts/prepare-ruvak.mjs
//
// · Personaje: recorte del margen transparente y tamaño máximo de 900 px, en WebP con alfa
//   → assets/ruvak/ruvak_[familia]_[variante]_v1.webp (convención del documento §12).
// · Iconos: cabeza del gato sobre negro tinta (icono, favicon) o transparente (icono adaptativo, splash).
// No se redibuja nada: solo se recorta, escala y compone.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SRC = join(ROOT, 'assets/ruvak/originales');
const OUT = join(ROOT, 'assets/ruvak');
const ICONS = join(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });

const INK = { r: 0x17, g: 0x19, b: 0x1d, alpha: 1 }; // tokens.ts › brand.ink
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const CHARACTER = [
  ['gato-sentado-astuto.webp', 'ruvak_gato_sentado_v1.webp'],
  ['gato-cabeza.webp', 'ruvak_gato_cabeza_v1.webp'],
  ['transformacion-gato-grajo.webp', 'ruvak_transformacion_secuencia_v1.webp'],
  ['grajo-ataque.webp', 'ruvak_grajo_ataque_v1.webp'],
  ['grajo-vuelo.webp', 'ruvak_grajo_vuelo_v1.webp'],
  ['gato-sorprendido.webp', 'ruvak_gato_sorprendido_v1.webp'],
  ['gato-sentado-mirada.webp', 'ruvak_gato_mirada_v1.webp'],
  ['gato-caminando.webp', 'ruvak_gato_caminando_v1.webp'],
  ['gato-de-pie.webp', 'ruvak_gato_de-pie_v1.webp'],
  ['gato-sentado-perfil.webp', 'ruvak_gato_perfil_v1.webp'],
];

for (const [src, out] of CHARACTER) {
  const max = out.includes('transformacion') ? 1600 : 900;
  const info = await sharp(join(SRC, src))
    .trim({ background: CLEAR, threshold: 1 })
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(join(OUT, out));
  console.log(`${out}: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
}

// Cabeza recortada en cuadrado (cara y orejas), base de todos los iconos.
const head = await sharp(join(SRC, 'gato-cabeza.webp')).trim({ background: CLEAR, threshold: 1 }).toBuffer({ resolveWithObject: true });
const side = Math.max(head.info.width, head.info.height);
const square = await sharp(head.data)
  .extend({
    top: Math.floor((side - head.info.height) / 2),
    bottom: Math.ceil((side - head.info.height) / 2),
    left: Math.floor((side - head.info.width) / 2),
    right: Math.ceil((side - head.info.width) / 2),
    background: CLEAR,
  })
  .png()
  .toBuffer();

async function icon(file, size, inner, background) {
  const glyph = await sharp(square).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: glyph, gravity: 'centre' }])
    .png()
    .toFile(join(ICONS, file));
  console.log(`${file}: ${size}×${size}`);
}

await icon('icon.png', 1024, 860, INK); // icono de la app (iOS y web)
await icon('android-icon-foreground.png', 1024, 640, CLEAR); // adaptativo: dentro de la zona segura (66 %)
await icon('favicon.png', 196, 180, INK);
await icon('splash-icon.png', 512, 512, CLEAR);
