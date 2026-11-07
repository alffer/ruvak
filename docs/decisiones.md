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
| 2026-11-07 | Azul de marca solo como fondo de botón; variantes claras para texto | El azul de marca no llega a 3:1 sobre fondo oscuro |
| 2026-11-07 | Mascota con las ilustraciones de la usuaria (WebP con alfa) e iconos generados desde la cabeza del gato | Identidad real; los originales se conservan intactos y los derivados se regeneran con `prepare-ruvak.mjs` |
