# Producto: qué hace hoy RUVAK

Referencia completa: [documento-producto.md](documento-producto.md). Aquí, lo implementado (versión 0.1.0, MVP).

## Navegación

- **Móvil**: barra inferior con Inicio, Descubrir, Mapa, Lugares (Mis lugares) y Perfil. Agenda y Viajes se abren desde Inicio y Perfil.
- **Escritorio (≥ 900 px)**: la misma navegación como barra lateral.
- **Selector de ciudad** en la cabecera de cada pestaña: ciudad activa y si es «Habitual» o «Explorando». Cambia Descubrir y Mapa; la colección es global.
- Las pantallas interiores siempre tienen «Volver» (si se abren por enlace directo, vuelve a Inicio).

## Pantallas

| Ruta                      | Pantalla                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/entrar`, `/registro`    | Acceso y alta (correo + contraseña de 8+ caracteres). Si el proyecto pide confirmar el correo, se avisa.          |
| `/recuperar`, `/nueva-clave` | Recuperar acceso por correo. El mensaje no revela si la cuenta existe.                                         |
| `/bienvenida`             | Primera vez: ciudad habitual (Gijón), intereses y personalización.                                                 |
| `/` Inicio                | Saludo, contadores, Añadir/Importar, Pendientes, Favoritos, 3 novedades y accesos a Agenda y Viajes.               |
| `/descubrir`              | Contenido editorial de la ciudad: filtros por tipo, categoría y zona; razón de la recomendación; guardar y ocultar. |
| `/mapa`                   | Mapa (Leaflet + OSM) con agrupación, guardados (círculo azul) y recomendaciones (rombo naranja), filtros, panel inferior y vista Lista. |
| `/lugares`                | Mis lugares: búsqueda (nombre, categoría, zona, nota, etiquetas), estados, categoría, zona, orden, archivados; pestaña Listas. |
| `/lista/[id]`             | Una lista: sugerida (`pending`, `favorites`, `visited`) o propia (renombrar, borrar).                              |
| `/lugar/[id]`             | Ficha: estado, favorito, listas, nota privada y etiquetas, información práctica, fuentes con fecha, archivar o borrar. |
| `/lugar/nuevo`            | Añadir: pegar enlace (TikTok, Instagram, Google Maps, web) o alta manual. Avisa de posibles duplicados.            |
| `/lugar/editar/[id]`      | Editar la ficha (propia; las editoriales solo administradores).                                                    |
| `/importar`               | Google Takeout: instrucciones, vista previa, selección, duplicados, resumen.                                       |
| `/perfil`                 | Nombre, intereses, personalización, importar, panel editorial (admin), exportar datos, cerrar sesión, borrar cuenta. |
| `/agenda`, `/viajes`      | «Próximamente» (fase P1).                                                                                          |
| `/admin`, `/admin/contenido` | Panel editorial: contenido de Descubrir (tipo, verificación, fuente, fecha, publicar, retirar) y fichas editoriales. |

## Reglas de comportamiento

- **Listas sugeridas** (Pendientes, Favoritos, Visitados) = estados del lugar. Las listas propias son aparte y privadas.
- **Duplicados**: por identificador de Google Maps, enlace normalizado, nombre + dirección o nombre + menos de 150 m. Mismo nombre lejos = otra sucursal. Siempre decide la persona.
- **Descartados** no salen en «Todos» ni en Descubrir; sí con el filtro «Descartados».
- **Recomendaciones**: novedades primero; con personalización, después lo que encaja con tus intereses. La razón («Porque te interesa: museos») solo aparece si es clara.
- **Ficha**: sin foto autorizada no hay foto. Horarios y reseñas se consultan en Google Maps (enlace), no se copian.
- **Panel editorial**: no deja publicar sin fuente ni publicar una apertura que no esté «Confirmada» o «Anunciada».

## Estado de los criterios de aceptación (§14)

| # | Criterio | Estado |
| - | -------- | ------ |
| 1 | Registrarse e iniciar sesión | Hecho |
| 2 | Gijón como ciudad habitual | Hecho (por defecto y en la bienvenida) |
| 3 | Crear lugar con nombre y categoría | Hecho |
| 4 | Guardar una URL como referencia | Hecho |
| 5 | Importar archivo válido con vista previa | Hecho; **falta validar con exportaciones reales** |
| 6 | Detectar posibles duplicados | Hecho (alta, enlace e importación) |
| 7 | Listas y lugar en varias listas | Hecho |
| 8 | Favoritos, pendientes y visitados | Hecho |
| 9 | Notas privadas | Hecho |
| 10 | Buscar y filtrar | Hecho (proximidad pendiente: requiere permiso de ubicación) |
| 11 | Lugares geolocalizados en el mapa | Hecho |
| 12 | Ficha desde mapa y lista | Hecho |
| 13 | Contenido editorial de Gijón | Hecho, con contenido de ejemplo **sin verificar** |
| 14 | Distinguir confirmado de no verificado | Hecho |
| 15 | Abrir la fuente de un dato | Hecho |
| 16 | Móvil y escritorio | Hecho (ver capturas) |
| 17 | Datos privados inaccesibles desde otra cuenta | Hecho y comprobado (`scripts/check-rls.sh`) |
| 18 | Estados de carga, error y vacío | Hecho |
| 19 | Sin datos inventados presentados como reales | Hecho: la semilla va marcada «Datos de ejemplo · Sin verificar» |
