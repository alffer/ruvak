# Diseño

Referencia visual: la lámina «Sistema de diseño» y las maquetas de la usuaria (móvil, claro y oscuro). Fuente de verdad en código: `src/lib/tokens.ts`.

## Marca

- **Logo**: «ruvak» en minúsculas (Space Grotesk bold) con un **guion bajo lima** («ruvak_»). `RuvakWordmark`.
- **Títulos**: llevan el mismo guion lima al final («Descubre Gijón_», «Explorar_»). `H1`/`H2` lo añaden solos; es decorativo y se oculta a los lectores de pantalla.
- **Personaje**: gato (a pie por la ciudad) y grajo (entre ciudades). Ver `mascota.md`.

## Color (lámina)

| Token | Valor | Uso |
| ----- | ----- | --- |
| `brand.ink` | `#17191D` | Fondo oscuro; texto en claro; texto sobre lima y naranja |
| `brand.cream` | `#F4F0E7` | Fondo claro; texto en oscuro; tarjetas «de papel» |
| `brand.lime` | `#C9D84B` | **Acción principal** (relleno + texto tinta), estado activo, guion de la marca |
| `brand.blue` | `#2457D6` | Enlaces e iconos activos **en tema claro** |
| `brand.orange` | `#F06438` | Etiquetas de novedad y categoría (texto tinta) y marcadores de recomendación |

Dos temas: **oscuro (por defecto)** y **claro**. En Perfil › Apariencia: Sistema, Oscuro o Claro; se guarda en el dispositivo.

**Contraste AAA (≥ 7:1) en todo el texto, en los dos temas**, comprobado automáticamente con `npm run check` (`scripts/check-contrast.ts`, que mide todas las combinaciones texto/fondo y falla si alguna baja de 7:1; bordes de controles ≥ 3:1). Valores del tema claro elegidos para cumplirlo: azul de acento `#173A94`, texto naranja `#7F2808`, peligro `#7E1B11`, éxito `#1F4A15`, secundario `#433F38`.

**Desviaciones deliberadas de las maquetas por accesibilidad**
- Etiqueta naranja: texto en **tinta** (no blanco: 3,2:1) sobre un naranja algo más claro, `newsFill` `#FA8C63` (tinta 7,5:1). El naranja de marca `#F06438` queda para marcadores y detalles, no para texto.
- El lima **nunca** se usa como texto sobre fondo claro (1,4:1): ahí el acento es un azul más oscuro que el de la lámina (`#173A94` en lugar de `#2457D6`, que daba 5,4:1).
- El «+» central lleva borde tinta en tema claro (forma lima sobre crema = 1,4:1).
- Las maquetas muestran valoraciones, horarios, precio medio, wifi y «pet friendly»: **solo aparecerán cuando existan datos reales** (editorial o fuente autorizada). Sin foto, portada tinta con la categoría.

## Tipografía

Reparto de la usuaria (licencias OFL, cargadas con `expo-font`):

| Uso | Tipografía | Peso | Token |
| --- | ---------- | ---- | ----- |
| Logotipo `ruvak_` | Wordmark propio | Propio | `fonts.wordmark` (provisional: Space Grotesk Bold hasta tener el archivo) |
| Titulares | Space Grotesk | SemiBold 600 | `hero`, `display`, `title`, `section`, `cardTitle` |
| Subtítulos | Space Grotesk | Medium 500 | `subtitle` |
| Textos y descripciones | Inter | Regular 400 | `body` |
| Botones y navegación | Inter | Medium 500 | `label` (y `bodyStrong` para énfasis) |
| Datos y metadatos | Inter | Regular 400 | `caption` |

Mayúsculas espaciadas (`overline`, Inter Medium) solo en etiquetas breves.

## Forma y componentes

- Botones y filtros en **píldora**; tarjetas con radio 16; escala de 4 px. Objetivos táctiles de **48 px** (chips, segmentos, botones, enlaces).
- **Pocos controles por pantalla**: los filtros secundarios se agrupan en un botón «Filtros» (Explorar, Mapa, Guardados); lo activo por defecto («Todo», capas del mapa) va en tono neutro y el lima queda para lo realmente activo.
- Botones: `primary` (lima), `solid` (tinta en claro, crema en oscuro: «Guardar»), `secondary` (contorno), `ghost`, `danger`.
- Filtros (`Chip`): activo en lima con ✓; inactivo con contorno.
- Accesos por categoría con icono (`CategoryShortcut`), buscador en píldora (`SearchField`) y tarjetas «de papel» de Recomendados (`RecommendedCard`).
- **Navegación inferior**: Inicio, Explorar, **«+» lima central (añadir lugar)**, Guardados y Mapa. El perfil va en la cabecera. En escritorio (≥ 900 px), barra lateral con «Añadir lugar» y Perfil.
- Estados siempre con icono + texto (nunca solo color): ✓ en filtros activos, forma distinta en los marcadores del mapa (círculo lima = guardado, rombo naranja = recomendación).
- Mapa: marcadores con borde tinta; en tema oscuro, teselas oscurecidas con un filtro CSS.
- Sin sombras salvo menús y popovers. Sin animaciones.

## Cómo se aplican los temas

`colors` en `tokens.ts` es un objeto vivo. `ThemeProvider` (`src/lib/theme.tsx`) aplica la paleta y vuelve a montar la app al cambiar. Los estilos que usan colores van en `themed(() => StyleSheet.create(...))` para recalcularse; los colores usados en línea se leen al renderizar.
