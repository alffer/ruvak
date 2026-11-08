# Datos (Supabase)

Esquema: `supabase/migrations/20261107000000_init.sql`. Semilla: `supabase/seed.sql`.

## Tablas

| Tabla | Qué guarda | Quién la ve |
| ----- | ---------- | ----------- |
| `cities` | Ciudades (centro, zoom, límites) | Todos (también sin sesión) |
| `categories` | Categorías (con `parent_id` para subcategorías) | Todos |
| `profiles` | 1:1 con `auth.users`: nombre, ciudad habitual, rol, personalización, bienvenida hecha | Solo el propio usuario |
| `user_interests` | Categorías de interés | Solo el propio usuario |
| `places` | **Ficha canónica**. `owner_id NULL` = editorial (pública); `owner_id = uid` = privada del usuario | Editoriales: usuarios con sesión. Privadas: su dueño |
| `place_sources` | Procedencia (tipo, URL, URL normalizada, id externo, fecha de comprobación). `owner_id NULL` = fuente editorial | Editorial: todos; propia: su dueño |
| `user_places` | Relación personal: estado, favorito, **nota privada**, etiquetas, fechas | Solo el propio usuario |
| `collections`, `collection_places` | Listas personalizadas y sus lugares | Solo el dueño |
| `discovery_items` | Contenido de Descubrir: tipo, verificación, fuente, fecha, publicado | Publicado: usuarios con sesión; borradores: admin |
| `hidden_discovery` | Recomendaciones ocultadas | Solo el propio usuario |
| `import_jobs` | Historial de importaciones (contadores y errores) | Solo el propio usuario |

`places.name_key` es una columna generada con `ruvak_name_key(name)` (minúsculas, sin tildes ni signos), idéntica a
`nameKey()` de `src/lib/dedupe.ts`. Hay índices por nombre normalizado, id externo y URL normalizada.

## Reglas de acceso (RLS)

- Todo dato personal se filtra por `auth.uid()`. Ni el administrador ve notas, estados ni listas de otros.
- Solo administradores (`profiles.role = 'admin'`, comprobado con `is_admin()`) crean o editan fichas editoriales y contenido de Descubrir.
- El rol no se puede cambiar desde el cliente: `authenticated` solo tiene `UPDATE` en `display_name`, `home_city_id`, `personalization_enabled` y `onboarded`.
- No se puede guardar, listar ni anotar una ficha privada ajena aunque se adivine su id.
- Sin sesión (`anon`) solo se leen `cities` y `categories`.
- `delete_my_account()` (security definer) borra el usuario y, en cascada, todos sus datos.
- Al crear la cuenta, un trigger crea el perfil con Gijón como ciudad habitual.

Todo esto lo comprueba `scripts/check-rls.sh`. **Cualquier tabla nueva con datos personales necesita RLS y una comprobación ahí.**

## Semilla

Gijón, 14 categorías, 9 fichas editoriales de lugares reales y conocidos (Elogio del Horizonte, Termas romanas de
Campo Valdés, Universidad Laboral…) y 5 entradas de Descubrir. Todo va como **«Sin verificar»**, con la fuente
«Datos de ejemplo de RUVAK» y **coordenadas aproximadas**; no hay horarios, teléfonos, valoraciones ni aperturas.
El equipo editorial debe verificarlo o retirarlo antes del lanzamiento. La semilla se puede ejecutar varias veces.

## Administración

- Hacer admin a alguien: ver README › «Configurar Supabase», paso 5.
- Retirar contenido: en `/admin/contenido`, «Marcar como antigua y retirar» (`verification = outdated`, `published = false`).

## Exportar y borrar (privacidad)

- Perfil › «Exportar mis datos»: JSON con perfil, intereses, relación con lugares, listas, ocultos, importaciones y fichas y fuentes propias.
- Perfil › «Borrar mi cuenta»: `delete_my_account()`.
