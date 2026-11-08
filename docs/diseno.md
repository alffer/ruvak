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

Contraste medido (WCAG 2.2): texto 15,5:1; secundario ≥ 6,9:1; lima sobre fondo oscuro 11,2:1; azul sobre crema 5,4:1 (AA); tinta sobre naranja 5,5:1; bordes de controles ≥ 3,1:1.

**Desviaciones deliberadas de las maquetas por accesibilidad**
- Texto de la etiqueta naranja en **tinta**, no blanco (blanco sobre naranja da 2,8:1).
- El lima **nunca** se usa como texto sobre fondo claro (1,2:1): ahí el acento es el azul.
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

- Botones y filtros en **píldora**; tarjetas con radio 16; escala de 4 px.
- Botones: `primary` (lima), `solid` (tinta en claro, crema en oscuro: «Guardar»), `secondary` (contorno), `ghost`, `danger`.
- Filtros (`Chip`): activo en lima con ✓; inactivo con contorno.
- Accesos por categoría con icono (`CategoryShortcut`), buscador en píldora (`SearchField`) y tarjetas «de papel» de Recomendados (`RecommendedCard`).
- **Navegación inferior**: Inicio, Explorar, **«+» lima central (añadir lugar)**, Guardados y Mapa. El perfil va en la cabecera. En escritorio (≥ 900 px), barra lateral con «Añadir lugar» y Perfil.
- Estados siempre con icono + texto (nunca solo color): ✓ en filtros activos, forma distinta en los marcadores del mapa (círculo lima = guardado, rombo naranja = recomendación).
- Mapa: marcadores con borde tinta; en tema oscuro, teselas oscurecidas con un filtro CSS.
- Sin sombras salvo menús y popovers. Sin animaciones.

## Cómo se aplican los temas

`colors` en `tokens.ts` es un objeto vivo. `ThemeProvider` (`src/lib/theme.tsx`) aplica la paleta y vuelve a montar la app al cambiar. Los estilos que usan colores van en `themed(() => StyleSheet.create(...))` para recalcularse; los colores usados en línea se leen al renderizar.
