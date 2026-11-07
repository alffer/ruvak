# Pendiente

## Para cerrar el MVP

- **Validar Google Takeout con archivos reales** (criterio 5). El lector admite el GeoJSON nuevo y antiguo de
  «Saved Places.json» y los CSV de «Guardado», según el formato documentado; falta probarlo con exportaciones reales
  y añadir esos casos a `scripts/check-takeout.ts`.
- **Verificar o retirar el contenido de ejemplo** de la semilla y cargar el contenido real de Gijón.
- **Identidad**: faltan por integrar más poses (dormido, sorprendido, caminando, de espaldas, grajo posado), el skyline, la textura de hormigón, los trazos de pintura lima y los iconos de exploración.
- **Probar en un proyecto de Supabase real**: registro con confirmación de correo, recuperar contraseña con
  *Redirect URLs*, y el mapa en móvil (WebView).
- **Proveedor de teselas** con condiciones para el tráfico previsto (OSM estándar solo vale para tráfico bajo).

## Fase P1

- Agenda (RF-10): tabla `events`, filtros por fecha y estado (en curso, cancelado, caducado).
- Viajes (RF-11): tablas `trips` y `trip_places`, más ciudades en `cities` y explorar sin viaje.
- Orden por proximidad (pide permiso de ubicación solo al usarlo).
- Notificaciones internas (RF-13).
- Compartir listas (decisión de producto abierta).

## Decisiones de producto abiertas (§16)

- Categorías iniciales definitivas (hay 14 provisionales en la semilla).
- Fuentes locales y frecuencia de revisión; quién mantiene el contenido editorial.
- Cómo pasa un lugar privado a ficha editorial (proponer → revisar).
- Despliegue de la web (por ejemplo EAS Hosting) y analítica (§15) sin notas ni ubicación.
