/**
 * Tokens de diseño de RUVAK (documento de producto §9–10). Es el único sitio con valores en bruto:
 * los componentes importan de aquí; nada de HEX sueltos.
 *
 * Contraste (WCAG 2.2), medido sobre surface0…surface3:
 * - text (cream) ≥ 11.5:1; textSecondary ≥ 7.1:1 (AAA en todas las superficies).
 * - brand.blue (#2457D6) NO sirve como texto sobre oscuro (2.1–3.0:1). Como fondo de botón con texto
 *   crema da 5.4:1 (AA, el objetivo del documento). Para enlaces y texto azul: blueText (≥ 7.2:1).
 * - brand.orange como texto solo da 4.1–5.8:1: para texto se usa orangeText (≥ 6.8:1). Sobre fondo
 *   naranja el texto es tinta (5.5:1), nunca crema (2.8:1).
 * - lime (≥ 8.3:1) es acento icónico: ojos, indicadores puntuales. No es color de botones.
 * - outline (bordes de controles) ≥ 3.1:1.
 */

export const brand = {
  blue: '#2457D6',
  orange: '#F06438',
  cream: '#F4F0E7',
  ink: '#17191D',
  lime: '#C9D84B',
} as const;

export const colors = {
  surface0: '#111316',
  surface1: brand.ink,
  surface2: '#22262C',
  surface3: '#2C3138',
  /** Fondo de la app. */
  bg: brand.ink,
  /** Tarjetas y barras. */
  card: '#22262C',
  /** Controles inactivos, chips e inputs encima de tarjetas. */
  raised: '#2C3138',
  text: brand.cream,
  textSecondary: '#C4BFB4',
  /** Bordes decorativos (no transmiten información). */
  border: 'rgba(244,240,231,0.10)',
  /** Bordes de inputs y controles (≥ 3:1). */
  outline: '#767C85',
  /** Acción principal: fondo azul + texto crema. */
  primary: brand.blue,
  onPrimary: brand.cream,
  /** Enlaces, iconos activos y texto azul. */
  blueText: '#A9C0F7',
  /** Novedades y avisos editoriales. */
  news: brand.orange,
  onNews: brand.ink,
  newsText: '#FFA587',
  lime: brand.lime,
  onLime: brand.ink,
  danger: '#FFB4AB',
  success: '#B9E3A8',
  scrim: 'rgba(17,19,22,0.78)',
  overlay: 'rgba(17,19,22,0.64)',
  /** Marcadores del mapa: guardados en azul (círculo) y recomendaciones en naranja (rombo). */
  markerSaved: brand.blue,
  markerDiscovery: brand.orange,
} as const;

/** Escala de 4 px (§10). */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const radii = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const borders = { hairline: 1, control: 1, selected: 2 } as const;

/** Familias cargadas en src/app/_layout.tsx con expo-font. */
export const fonts = {
  heading: 'SpaceGrotesk_700Bold',
  headingMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  section: { fontFamily: fonts.heading, fontSize: 19, lineHeight: 24 },
  cardTitle: { fontFamily: fonts.headingMedium, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  /** Mayúsculas espaciadas: solo etiquetas breves (§9 Tipografía). */
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

export const iconSize = { sm: 16, md: 20, lg: 24 } as const;

/** Objetivo táctil mínimo. */
export const touchTarget = 48;

/** Ancho máximo del contenido en escritorio y punto de corte para la navegación lateral. */
export const layout = { maxContent: 1120, sidebarBreakpoint: 900, sidebarWidth: 232 } as const;

export const states = { pressedOpacity: 0.72, disabledOpacity: 0.4 } as const;

/** Sin sombras por defecto: superficies y bordes antes que profundidad (§10). Solo menús/popovers. */
export const elevation = {
  popover: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
} as const;
