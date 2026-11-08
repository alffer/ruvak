/**
 * Tokens de diseño de RUVAK. Es el único sitio con valores en bruto: los componentes importan de aquí;
 * nada de HEX sueltos. Referencia: la lámina «Sistema de diseño» y las maquetas de la usuaria (docs/diseno.md).
 *
 * Marca (lámina): ink #17191D, cream #F4F0E7, electric blue #2457D6, orange #F06438, lime #C9D84B.
 * Dos temas, oscuro (por defecto) y claro. `colors` es un objeto vivo: `applyScheme()` lo rellena con el
 * tema elegido y ThemeProvider (src/lib/theme.tsx) vuelve a montar la app. Los estilos que usan colores se
 * crean con `themed(() => StyleSheet.create(...))` para que se recalculen al cambiar de tema.
 *
 * Contraste medido (WCAG 2.2), AAA (≥ 7:1) en todo el texto, sobre bg, card, raised y surface0, en los dos temas:
 * - Oscuro: texto crema ≥ 11,5:1; secundario ≥ 7,1:1; lima (acento) ≥ 8,3:1; tinta sobre lima 11,2:1.
 * - Claro: texto tinta ≥ 13,8:1; secundario #433F38 ≥ 8,2:1; azul de acento #173A94 ≥ 7,9:1; naranja de texto
 *   #7F2808 ≥ 7,4:1; peligro #7E1B11 ≥ 8,0:1; éxito #1F4A15 ≥ 8,0:1.
 * - Etiqueta naranja: relleno `newsFill` #FA8C63 con texto tinta 7,5:1. El naranja de marca #F06438 (tinta 5,5:1; blanco,
 *   que usa la lámina, 3,2:1) queda para elementos que no son texto (marcadores, detalles).
 * - El lima no va como texto en claro (1,4:1): solo como relleno con texto tinta o como detalle decorativo.
 * - Bordes de controles ≥ 3,1:1 y formas (marcadores, botón «+») ≥ 3:1 gracias a su borde tinta.
 */

export const brand = {
  ink: '#17191D',
  cream: '#F4F0E7',
  blue: '#2457D6',
  orange: '#F06438',
  lime: '#C9D84B',
} as const;

const darkPalette = {
  bg: brand.ink,
  surface0: '#111316',
  /** Tarjetas y barras. */
  card: '#22262C',
  /** Controles inactivos e inputs. */
  raised: '#2C3138',
  /** Tarjetas «de papel» (categorías y recomendados), como en las maquetas: crema con texto tinta. */
  paper: brand.cream,
  onPaper: brand.ink,
  onPaperSecondary: '#4E4A43',
  text: brand.cream,
  textSecondary: '#C4BFB4',
  border: 'rgba(244,240,231,0.10)',
  outline: '#767C85',
  /** Acción principal: relleno lima + texto tinta. */
  primary: brand.lime,
  onPrimary: brand.ink,
  /** Botón sólido neutro («Guardar»): crema en oscuro, tinta en claro. */
  solid: brand.cream,
  onSolid: brand.ink,
  /** Texto e iconos de acento (enlaces, pestaña activa). */
  accentText: brand.lime,
  /** Detalle decorativo de marca: el guion bajo de títulos y logo. */
  mark: brand.lime,
  /** Etiquetas de novedad y categoría: naranja con texto tinta. */
  news: brand.orange,
  /** Relleno de etiquetas de novedad: naranja más claro para que el texto tinta llegue a AAA. */
  newsFill: '#FA8C63',
  onNews: brand.ink,
  newsText: '#FFB59C',
  danger: '#FFB4AB',
  success: '#C9E7B4',
  scrim: 'rgba(17,19,22,0.78)',
  overlay: 'rgba(17,19,22,0.64)',
  /** Mapa: guardados = círculo lima; recomendaciones = rombo naranja. Forma distinta, no solo color. */
  markerSaved: brand.lime,
  markerDiscovery: brand.orange,
  markerEdge: brand.ink,
};

export type Palette = Record<keyof typeof darkPalette, string>;
const dark: Palette = darkPalette;

const light: Palette = {
  bg: brand.cream,
  surface0: '#FBF8F1',
  card: '#FCFAF5',
  raised: '#EAE3D6',
  paper: '#FCFAF5',
  onPaper: brand.ink,
  onPaperSecondary: '#433F38',
  text: brand.ink,
  textSecondary: '#433F38',
  border: 'rgba(23,25,29,0.18)',
  outline: '#7C766C',
  primary: brand.lime,
  onPrimary: brand.ink,
  solid: brand.ink,
  onSolid: brand.cream,
  accentText: '#173A94',
  mark: brand.lime,
  news: brand.orange,
  newsFill: '#FA8C63',
  onNews: brand.ink,
  newsText: '#7F2808',
  danger: '#7E1B11',
  success: '#1F4A15',
  scrim: 'rgba(23,25,29,0.6)',
  overlay: 'rgba(23,25,29,0.45)',
  markerSaved: brand.lime,
  markerDiscovery: brand.orange,
  markerEdge: brand.ink,
};

export type SchemeName = 'dark' | 'light';

/** Paleta activa (objeto vivo). */
export const colors: Palette = { ...dark };
let current: SchemeName = 'dark';
let version = 0;

export function applyScheme(s: SchemeName) {
  if (s === current && version > 0) return;
  current = s;
  Object.assign(colors, s === 'light' ? light : dark);
  version++;
}

export function currentScheme(): SchemeName {
  return current;
}

/** Estilos que dependen del tema: se recalculan la primera vez que se leen tras un cambio de tema. */
export function themed<T extends object>(make: () => T): T {
  let cache: T | null = null;
  let seen = -1;
  const get = () => {
    if (seen !== version || !cache) {
      cache = make();
      seen = version;
    }
    return cache;
  };
  return new Proxy({} as T, { get: (_t, key) => get()[key as keyof T] });
}

/** Escala de 4 px. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

/** Radios de las maquetas: tarjetas suaves (16), píldoras para filtros y botones. */
export const radii = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const borders = { hairline: 1, control: 1, selected: 2 } as const;

/**
 * Reparto tipográfico (lámina): titulares Space Grotesk SemiBold 600; subtítulos Space Grotesk Medium 500;
 * textos y descripciones Inter Regular 400; botones y navegación Inter Medium 500; datos y metadatos Inter Regular 400.
 * El logotipo es un wordmark propio: mientras no haya el archivo se compone con Space Grotesk Bold (provisional).
 * Familias cargadas en src/app/_layout.tsx con expo-font.
 */
export const fonts = {
  heading: 'SpaceGrotesk_600SemiBold',
  subtitle: 'SpaceGrotesk_500Medium',
  wordmark: 'SpaceGrotesk_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
} as const;

export const typography = {
  hero: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 42, letterSpacing: -1 },
  display: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 36, letterSpacing: -0.8 },
  title: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  section: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  /** Subtítulos (bajo un titular). */
  subtitle: { fontFamily: fonts.subtitle, fontSize: 17, lineHeight: 24 },
  /** Textos y descripciones. */
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  /** Texto con énfasis (nombres dentro de un párrafo, filas destacadas). */
  bodyStrong: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  /** Botones, filtros y navegación. */
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  /** Datos y metadatos. */
  caption: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  /** Solo para etiquetas de iconos en recuadros estrechos (accesos por categoría). */
  micro: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  /** Mayúsculas espaciadas: solo etiquetas breves. */
  overline: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

export const iconSize = { sm: 16, md: 20, lg: 24 } as const;

/** Objetivo táctil mínimo. */
export const touchTarget = 48;

/** Ancho máximo del contenido en escritorio y punto de corte para la navegación lateral. */
export const layout = { maxContent: 1120, sidebarBreakpoint: 900, sidebarWidth: 232 } as const;

export const states = { pressedOpacity: 0.72, disabledOpacity: 0.4 } as const;

/** Sin sombras salvo menús y popovers. */
export const elevation = {
  popover: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
} as const;
