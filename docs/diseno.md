# Diseño

Fuente: documento de producto §9–11. Valores solo en `src/lib/tokens.ts`.

## Color

| Token | Valor | Uso |
| ----- | ----- | --- |
| `brand.blue` / `colors.primary` | `#2457D6` | Fondo de acciones principales (texto crema, **5,4:1, AA**) |
| `colors.blueText` | `#A9C0F7` | Enlaces, iconos activos, texto azul (≥ 7,2:1) |
| `brand.orange` / `colors.news` | `#F06438` | Fondo de etiquetas de novedades (texto tinta, 5,5:1) y marcadores de recomendación |
| `colors.newsText` | `#FFA587` | Texto naranja (≥ 6,8:1) |
| `brand.lime` | `#C9D84B` | Ojos de RUVAK, sobrelíneas y detalles puntuales. **No** es color de botones |
| `brand.cream` / `colors.text` | `#F4F0E7` | Texto principal (≥ 11,5:1) |
| `colors.textSecondary` | `#C4BFB4` | Texto secundario (≥ 7,1:1, AAA en todas las superficies) |
| `surface0…3` | `#111316` `#17191D` `#22262C` `#2C3138` | Fondos y tarjetas |
| `colors.outline` | `#767C85` | Bordes de controles (≥ 3,1:1) |

**Por qué**: el azul de marca da 2,1–3,0:1 sobre fondos oscuros, así que no se usa para texto. El naranja da 2,8:1 con texto crema; sobre naranja, el texto va en tinta.

## Tipografía

Space Grotesk (titulares) e Inter (interfaz), las dos con licencia OFL y cargadas con `expo-font`. Mayúsculas espaciadas (`overline`) solo en etiquetas breves.

## Reglas

- Escala de espaciado de 4 px (`space`), radios moderados (`radii`), sin sombras salvo menús y popovers.
- Objetivos táctiles de 48 px. Estados siempre con icono + texto: ✓ en chips seleccionados, iconos en las etiquetas de estado, forma distinta en los marcadores del mapa.
- Fotografía: solo fotos reales con permiso y crédito. Sin foto, bloque tipográfico con línea lima.
- Sin hover como requisito; sin animaciones (respeta movimiento reducido).
- Iconos: Lucide de trazo 2. No se mezclan con ilustraciones de RUVAK en la navegación.

## Componentes (`src/components`)

`ui.tsx`: Screen, H1/H2/P/Overline, SectionHeader, Card, Row, Button (primary/secondary/ghost/danger), LinkButton,
Chip/ChipRow, Field, ToggleRow, Segmented, Badge, InlineNotice, Loading, SkeletonList, ErrorState, confirmAction.
`Place.tsx`: PlaceListItem, PlaceStatusBadge, VerificationBadge, KindBadge, DiscoveryCard, SourceLine.
`CitySwitcher.tsx`, `PlaceForm.tsx`, `Ruvak.tsx` (RuvakAvatar, RuvakEmptyState), `map/`.
