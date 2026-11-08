# Arquitectura

## Stack

- **Expo SDK 58**, React Native 0.88, React 19, TypeScript estricto. Igual que Sandow.
- **Expo Router** con rutas en `src/app/`. Web (`react-native-web`), Android e iOS desde el mismo código.
- **Supabase** (`@supabase/supabase-js`): Auth (correo + contraseña), Postgres y RLS. La sesión se guarda en
  `localStorage` en web y en `AsyncStorage` en móvil.
- **Prettier** (comillas simples, 160 columnas, comas finales) y **ESLint** de Expo (con las reglas del React Compiler).
- `.npmrc` activa `legacy-peer-deps` (como Sandow).

## Carpetas

```
src/app/                pantallas (rutas)
  _layout.tsx           fuentes, SessionProvider y rutas protegidas (Stack.Protected)
  (tabs)/               index (Inicio), descubrir, mapa, lugares, perfil
  lugar/                [id] (ficha), nuevo, editar/[id]
  lista/[id].tsx        lista sugerida o propia
  admin/                panel editorial
src/components/         ui (Button, Chip, Field, Card, Badge, Segmented, ToggleRow, InlineNotice, ErrorState…),
                        Icon, Place (tarjetas y etiquetas), PlaceForm, CitySwitcher, Ruvak (ilustraciones de la mascota),
                        SetupNeeded, map/ (MapCanvas web y móvil)
src/lib/                sin UI: tokens (paletas clara/oscura), theme (ThemeProvider), types, supabase, session, data, useLoad, format, authErrors,
                        y lógica pura comprobada por scripts: dedupe, takeout, urlParse, filters, recommend
supabase/               migrations/ (esquema + RLS) y seed.sql
scripts/                check-*.ts (lógica pura), check-rls.sh/.sql (+ rls-stub.sql), capture-screens.mjs
docs/                   esta documentación
```

## Flujo de datos

- Las pantallas no hablan con Supabase: usan `src/lib/data.ts`, que mapea filas `snake_case` a tipos de `types.ts`.
- `useLoad(fn, deps)` carga con estados de carga/error y recarga al volver a la pantalla (`useFocusEffect`)
  o cuando cualquier pantalla llama a `bump()` tras cambiar datos (`SessionProvider.version`).
- `SessionProvider` (`src/lib/session.tsx`): sesión, perfil, intereses, ciudades, categorías y ciudad activa.
- Seguridad: **en la base de datos** (RLS). El cliente solo oculta lo que no tiene sentido mostrar.

## Mapa

- `src/components/map/MapCanvas.web.tsx`: Leaflet + `leaflet.markercluster` sobre el DOM.
- `src/components/map/MapCanvas.tsx`: el mismo Leaflet dentro de `react-native-webview` (como `PdfReader` en Sandow),
  cargado desde unpkg con versión fija; se comunica por `postMessage`.
- Se carga con `React.lazy` al abrir la pestaña Mapa (en web sale en un fragmento aparte de ~187 KB).
- Teselas: OpenStreetMap por defecto, configurable con `EXPO_PUBLIC_MAP_TILE_URL` y `EXPO_PUBLIC_MAP_TILE_ATTRIBUTION`.
  El dominio no depende del proveedor.

## Librerías y por qué

| Librería | Uso |
| -------- | --- |
| @supabase/supabase-js | Auth, base de datos y RLS |
| @react-native-async-storage/async-storage | Sesión de Supabase en móvil |
| react-native-url-polyfill | `URL` completo en móvil (lo pide supabase-js) |
| leaflet, leaflet.markercluster | Mapa y agrupación de marcadores (sin coste ni clave) |
| react-native-webview | Leaflet en móvil |
| expo-document-picker, expo-file-system | Elegir y leer el archivo de Takeout (solo lectura) |
| expo-font, @expo-google-fonts/inter, @expo-google-fonts/space-grotesk | Tipografías de marca (OFL) |
| lucide-react-native, react-native-svg | Iconos lineales (como Sandow) |
| sharp (dev) | Genera los assets de la mascota y los iconos (`scripts/prepare-ruvak.mjs`) |
| expo-image | Fotos de fichas (solo si existen y tienen permiso) |

## Comprobaciones

- `npm run check`: `check-dedupe`, `check-takeout`, `check-url`, `check-filters` (con `tsx`, como en Sandow).
- `scripts/check-rls.sh`: Postgres desechable + `rls-stub.sql` (roles `anon`/`authenticated`, `auth.users`,
  `auth.uid()`), migración, semilla dos veces (idempotente) y `check-rls.sql` (aislamiento, admin, anónimo, baja).
- `scripts/capture-screens.mjs`: exporta la web con una URL de demostración, simula Supabase en Playwright y
  guarda capturas móvil/escritorio en `docs/capturas/`. No se usa red real.

## Puntos delicados

- **WebView**: sus tipos colapsan a `never` con esta versión de RN; `MapCanvas.tsx` lo tipa con las props de Android (como Sandow).
- **Pestañas ocultas**: no usar `href: null` para esconder una pestaña a la que se navega por código (el Perfil en móvil): en Expo Router 58 la marca como oculta y navegar a ella redirige a Inicio. Se oculta con `tabBarItemStyle: { display: 'none' }`. `scripts/capture-screens.mjs` incluye una prueba de humo que pulsa el botón de perfil.
- **Despliegue web (Cloudflare Workers)**: `.github/workflows/deploy-web.yml` publica `dist/` en cada push a `main` (y a mano con `workflow_dispatch`). El Worker sirve activos estáticos con `not_found_handling: single-page-application`, para que `/lugar/101` devuelva `index.html`. Las claves de Supabase van como secretos de GitHub, porque se incluyen al compilar. Se salta si no existe la variable `CLOUDFLARE_WORKER_NAME`. Cloudflare Pages y `_redirects` no aplican aquí.
- **TypeScript 6** ya no incluye `@types/node` por defecto: los scripts llevan `/// <reference types="node" />`.
- **React Compiler (lint)**: los formularios que parten de datos cargados se montan con `key` y estado inicial
  (sin copiar en `useEffect`).
- **Instalar dependencias**: `expo install` no llega a la API de Expo desde algunos entornos; con `EXPO_OFFLINE=1` usa las versiones incluidas en el SDK.
