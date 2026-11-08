# Decisiones

| Fecha | Decisión | Motivo |
| ----- | -------- | ------ |
| 2026-11-07 | **Expo + Expo Router**, como Sandow | Mismo stack que la otra app de la usuaria; la web sale del mismo código y deja abierta la app móvil |
| 2026-11-07 | **Supabase** como backend | Hace falta servidor (cuentas, contenido editorial compartido, aislamiento entre usuarios). Auth + Postgres + RLS sin mantener un servidor propio |
| 2026-11-07 | Seguridad en **RLS**, comprobada con `check-rls.sh` en un Postgres real | Criterio 17: que sea imposible, no solo que la interfaz no lo enseñe |
| 2026-11-07 | Ficha canónica con `owner_id` (NULL = editorial) | Una ficha por lugar; los lugares que añade cada persona son privados hasta que haya una forma de proponerlos |
| 2026-11-07 | Pendientes/Favoritos/Visitados son **vistas de estados**, no listas guardadas | Si fueran ambas cosas se desincronizarían; así siempre cuadran |
| 2026-11-07 | Duplicados: avisar, nunca fusionar solos; mismo nombre lejos (> 150 m) no es duplicado | RF-03 y «no crear duplicados silenciosamente», sin confundir sucursales |
| 2026-11-07 | Leaflet + OSM, también en móvil (WebView) | Sin coste ni clave; un solo código de mapa. Proveedor de teselas configurable |
| 2026-11-07 | Pegar URL **no** descarga la página | Sin scraping (§8): solo se lee la propia URL (tipo, nombre y coordenadas de Google Maps si vienen en ella) |
| 2026-11-07 | Semilla con lugares reales, «Sin verificar» y sin horarios ni aperturas | Criterio 19: nada inventado presentado como real |
| 2026-11-08 | Identidad según las maquetas y la lámina de la usuaria: lima como color de acción, azul solo en claro (enlaces), naranja en etiquetas | Es el diseño que quiere; el lima del documento original pasa de «detalle» a acción principal |
| 2026-11-08 | Dos temas (oscuro por defecto, claro) con preferencia guardada | Las maquetas traen los dos; «Sistema» respeta el ajuste del móvil |
| 2026-11-08 | Navegación inferior de la lámina: Inicio, Explorar, «+», Guardados, Mapa; perfil en la cabecera | Añadir un lugar es la acción más frecuente; Perfil y Agenda/Viajes pasan a segundo nivel |
| 2026-11-08 | Valoraciones, horarios, precio, wifi y fotos de las maquetas solo con datos reales | Criterio 19: nada inventado presentado como real |
| 2026-11-08 | Texto de etiquetas naranjas en tinta, no blanco | Blanco sobre naranja da 2,8:1 |
| 2026-11-07 | Mascota con las ilustraciones de la usuaria (WebP con alfa) e iconos generados desde la cabeza del gato | Identidad real; los originales se conservan intactos y los derivados se regeneran con `prepare-ruvak.mjs` |
| 2026-11-08 | Revisión UX por un agente experto antes de presentar cualquier cambio visual (norma en `CLAUDE.md`) | Petición de la usuaria; la primera pasada encontró contraste AAA incumplido en claro, objetivos táctiles de 40–42 px y exceso de controles |
| 2026-11-08 | Tema claro con acento azul `#173A94` y textos más oscuros; etiqueta naranja con relleno `#FA8C63` | Cumplir AAA (7:1) en todo el texto; el azul/naranja de la lámina daban 5,3–5,4:1 |
| 2026-11-08 | Perfil en móvil oculto de la barra con `tabBarItemStyle`, no con `href: null` | `href: null` hace que navegar a la ruta redirija a Inicio: el botón de perfil de la cabecera no funcionaba (lo detectó la revisión UX) |
| 2026-11-08 | Agenda y Viajes sin accesos visibles hasta que existan | Llevaban a páginas vacías (confunde); las rutas siguen creadas |
| 2026-11-08 | Reparto tipográfico de la usuaria: Space Grotesk 600/500, Inter 400/500; wordmark propio | Pesos concretos por uso; el wordmark se compone provisionalmente hasta tener el archivo |
| 2026-11-08 | Web en Cloudflare Workers (activos estáticos) con `not_found_handling: single-page-application`, como Belladonna; sin `_redirects` | Workers no lee `_redirects`; sin esa opción, recargar `/lugar/101` daría 404. npm en lugar de pnpm porque el repositorio tiene `package-lock.json` |
