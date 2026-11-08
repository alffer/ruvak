/// <reference types="node" />
// Comprueba el contraste AAA de las paletas de src/lib/tokens.ts en los dos temas.
// Texto: ≥ 7:1. Componentes de interfaz (bordes de controles): ≥ 3:1. Ejecutar: npx tsx scripts/check-contrast.ts
import assert from 'node:assert/strict';
import { applyScheme, colors, type SchemeName } from '../src/lib/tokens';

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a: string, b: string) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

type K = keyof typeof colors;
// [texto, fondo]: todas las combinaciones de texto que usa la app.
const TEXT: [K, K][] = [
  ['text', 'bg'], ['text', 'card'], ['text', 'raised'], ['text', 'surface0'],
  ['textSecondary', 'bg'], ['textSecondary', 'card'], ['textSecondary', 'raised'], ['textSecondary', 'surface0'],
  ['accentText', 'bg'], ['accentText', 'card'], ['accentText', 'raised'], ['accentText', 'surface0'],
  ['newsText', 'bg'], ['newsText', 'card'], ['newsText', 'raised'], ['newsText', 'surface0'],
  ['danger', 'bg'], ['danger', 'card'], ['danger', 'raised'], ['success', 'bg'], ['success', 'card'],
  ['onPrimary', 'primary'], ['onNews', 'newsFill'], ['onSolid', 'solid'],
  ['onPaper', 'paper'], ['onPaperSecondary', 'paper'],
];
const UI: [K, K][] = [['outline', 'bg'], ['outline', 'card'], ['outline', 'raised']];

for (const scheme of ['dark', 'light'] as SchemeName[]) {
  applyScheme(scheme);
  for (const [fg, bg] of TEXT) {
    const r = ratio(colors[fg], colors[bg]);
    assert.ok(r >= 7, `${scheme}: ${fg} sobre ${bg} = ${r.toFixed(2)}:1 (< 7:1, AAA)`);
  }
  for (const [fg, bg] of UI) {
    const r = ratio(colors[fg], colors[bg]);
    assert.ok(r >= 3, `${scheme}: ${fg} sobre ${bg} = ${r.toFixed(2)}:1 (< 3:1, componente)`);
  }
}
console.log('check-contrast: OK');
