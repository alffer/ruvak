# RUVAK

## Documento de producto, requisitos y sistema de diseño

**Versión:** 1.0 · **Estado:** Base para iniciar desarrollo · **Primera
ciudad:** Gijón

------------------------------------------------------------------------

# 1. Resumen ejecutivo

RUVAK es una aplicación web de descubrimiento local, organización de
lugares y planificación de viajes. Resuelve la dispersión de sitios
guardados en TikTok, Instagram, Google Maps, publicaciones, enlaces y
capturas. Permite reunirlos en una colección personal, visualizarlos en
un mapa, clasificarlos y recuperar la información cuando llega el
momento de visitarlos.

El producto combina dos capacidades diferentes:

1.  **Mi colección:** lugares que la persona ha encontrado, importado o
    guardado.
2.  **Descubrir:** lugares nuevos, aperturas, eventos y planes que RUVAK
    incorpora mediante fuentes públicas y curación editorial, aunque la
    persona no los haya guardado previamente.

La primera ciudad será **Gijón**. La arquitectura permitirá incorporar
otras ciudades y viajes sin crear productos separados. Las preferencias
del usuario deben acompañarlo de una ciudad a otra.

**Propuesta de valor:** convertir una colección dispersa de sitios
interesantes en un mapa personal útil y, al mismo tiempo, descubrir
novedades locales relevantes.

## Principios del producto

-   Primero recuperar lo guardado, después descubrir.
-   Diferenciar claramente los guardados personales del contenido
    editorial.
-   Una ficha canónica por lugar, aunque aparezca en varias listas o
    fuentes.
-   Control del usuario sobre sus listas, notas, estados y privacidad.
-   Ciudad activa siempre visible.
-   Mostrar fuente y fecha de actualización de la información.
-   No inventar horarios, aperturas, reseñas ni datos.
-   Diseño útil antes que decorativo.

------------------------------------------------------------------------

# 2. Problema y necesidades que cubre

  -----------------------------------------------------------------------
  Problema                Necesidad               Solución RUVAK
  ----------------------- ----------------------- -----------------------
  Guardados repartidos    Centralizar             Colección personal
  entre varias                                    
  plataformas                                     

  Muchos sitios sin       Ordenar y recuperar     Listas, etiquetas y
  clasificar                                      filtros

  Se olvida por qué se    Conservar contexto      Notas y fuente original
  guardó un lugar                                 

  Un mapa personal no     Descubrimiento          Sección editorial local
  descubre novedades      proactivo               

  Agendas y eventos       Consultar planes por    Agenda
  dispersos               fecha                   

  Lugares de viajes       Separar contextos       Ciudades y viajes
  mezclados con los                               
  habituales                                      

  Datos repetidos o       Confiar en la           Ficha única, fuentes y
  antiguos                información             verificación
  -----------------------------------------------------------------------

## Necesidades principales

-   Guardar un sitio rápidamente desde una URL o mediante alta manual.
-   Importar una colección existente cuando sea técnicamente posible.
-   Ver los lugares en mapa y en lista.
-   Clasificar por listas, categorías, etiquetas y estado.
-   Marcar como pendiente, visitado, favorito o descartado.
-   Añadir notas privadas.
-   Encontrar lugares por nombre, categoría, zona o nota.
-   Descubrir cafeterías, restaurantes, tiendas independientes,
    librerías, espacios culturales, mercadillos, talleres, exposiciones
    y eventos.
-   Consultar información práctica antes de desplazarse.
-   Crear espacios para viajes y reutilizar preferencias entre ciudades.

## Fuera de alcance inicial

-   Reservas y pagos.
-   Navegación giro a giro o tráfico.
-   Red social generalista.
-   Sistema abierto de reseñas.
-   Sincronización bidireccional garantizada con Google Maps.
-   Importación automática universal de guardados privados de redes
    sociales.
-   Scraping indiscriminado de plataformas cerradas.

------------------------------------------------------------------------

# 3. Usuarios y escenarios

## Usuario principal

Persona que descubre lugares en redes sociales, recomendaciones, medios
locales y mapas; guarda muchos sitios y necesita organizarlos y
convertirlos en planes.

## Perfiles

1.  **Explorador local:** busca novedades en su ciudad.
2.  **Coleccionista:** ya tiene cientos de guardados y necesita
    importarlos, limpiarlos y clasificarlos.
3.  **Planificador de viajes:** prepara una ciudad antes de viajar y
    quiere consultar sus lugares durante el viaje.
4.  **Usuario espontáneo:** busca algo interesante para hoy o cerca de
    una zona.

## Historias de usuario

### Colección

-   Como usuario, quiero importar mis guardados para no empezar desde
    cero.
-   Quiero guardar un lugar desde una URL.
-   Quiero añadir un sitio a varias listas.
-   Quiero marcarlo como pendiente, visitado o favorito.
-   Quiero guardar notas privadas.
-   Quiero buscar por nombre, categoría, zona o nota.

### Mapa

-   Quiero ver dónde están mis sitios.
-   Quiero filtrar por lista, categoría y estado.
-   Quiero abrir la ficha desde un marcador.
-   Quiero poder usar la vista de lista si el mapa no está disponible.

### Descubrimiento y agenda

-   Quiero ver novedades de mi ciudad.
-   Quiero distinguir una apertura confirmada de un anuncio o rumor.
-   Quiero encontrar lugares relacionados con mis intereses.
-   Quiero guardar eventos antes de que ocurran y consultar sus fechas.

### Viajes

-   Quiero crear un viaje asociado a una ciudad.
-   Quiero organizar lugares dentro de ese viaje.
-   Quiero conservar mis viajes anteriores.
-   Quiero que mis preferencias se apliquen también al explorar otras
    ciudades.

------------------------------------------------------------------------

# 4. Arquitectura funcional y navegación

## Navegación principal

1.  **Inicio:** resumen personal, pendientes y novedades.
2.  **Descubrir:** lugares, aperturas y recomendaciones.
3.  **Mapa:** lugares guardados y descubiertos.
4.  **Mis lugares:** colección, listas, favoritos y visitados.
5.  **Agenda:** eventos y planes temporales.
6.  **Viajes:** ciudades y viajes guardados.
7.  **Perfil/Ajustes:** preferencias, importación, privacidad y cuenta.

En escritorio puede utilizarse navegación lateral. En móvil, navegación
inferior con las secciones prioritarias y acceso secundario al resto.

## Selector de ciudad

Debe estar visible y mostrar: - Ciudad activa. - Si es ciudad habitual o
viaje. - Acceso para cambiar de ciudad. - Opción para crear un viaje o
añadir una ciudad.

La ciudad activa modifica el contexto de Descubrir, Mapa y Agenda, pero
no altera la colección global.

## Ciudad y viaje

-   **Ciudad habitual:** contexto permanente, inicialmente Gijón.
-   **Ciudad explorada:** ciudad consultada sin necesidad de fechas.
-   **Viaje:** instancia temporal asociada a una ciudad, con nombre y
    fechas opcionales.

Un lugar puede estar asociado a varios viajes y listas sin duplicar su
ficha.

------------------------------------------------------------------------

# 5. Requisitos funcionales

Prioridades: **P0** imprescindible para MVP; **P1** siguiente fase;
**P2** evolución.

  -----------------------------------------------------------------------
  ID                      Requisito               Prioridad
  ----------------------- ----------------------- -----------------------
  RF-01                   Registro, inicio/cierre P0
                          de sesión y             
                          recuperación de acceso  

  RF-02                   Perfil, ciudad habitual P0
                          y preferencias          

  RF-03                   Crear, editar y         P0
                          archivar lugares        

  RF-04                   Importar colección      P0
                          desde archivo           
                          compatible              

  RF-05                   Crear y gestionar       P0
                          listas                  

  RF-06                   Búsqueda, filtros y     P0
                          ordenación              

  RF-07                   Mapa con marcadores y   P0
                          filtros                 

  RF-08                   Ficha completa de lugar P0

  RF-09                   Descubrimiento local    P0
                          con contenido curado    

  RF-10                   Agenda de eventos       P1

  RF-11                   Crear y gestionar       P1
                          viajes                  

  RF-12                   Recomendaciones         P1/P2
                          personalizadas          

  RF-13                   Notificaciones          P1

  RF-14                   Administración          P0
                          editorial               
  -----------------------------------------------------------------------

## RF-01. Cuenta y sesión

-   Crear cuenta, iniciar y cerrar sesión.
-   Recuperar acceso.
-   Proteger las rutas privadas.
-   Asociar datos personales a su usuario.
-   Permitir exportar y solicitar eliminación de datos.

## RF-02. Perfil y preferencias

-   Configurar ciudad habitual.
-   Seleccionar categorías de interés.
-   Editar o desactivar personalización.
-   Utilizar señales explícitas como favoritos, guardados, visitados y
    descartes.
-   No inferir preferencias sensibles.

## RF-03. Lugares

Campos posibles: nombre, dirección, coordenadas, ciudad, categoría,
descripción, URL, imágenes, teléfono, web y fuente. Acciones: crear,
editar, archivar, guardar, marcar favorito, pendiente, visitado o
descartado, añadir nota y añadir a listas. - Un lugar puede existir
aunque no tenga coordenadas. - Detectar duplicados por identificador
externo, URL normalizada y coincidencia de nombre/dirección. - Permitir
resolver manualmente posibles duplicados.

## RF-04. Importación

-   Admitir inicialmente un formato de Google Takeout validado con
    archivos reales.
-   Mostrar vista previa antes de importar.
-   Permitir seleccionar elementos.
-   Informar de registros omitidos, incompletos o duplicados.
-   No modificar el archivo original.
-   Ofrecer alta manual o pegado de URL como alternativa.
-   No prometer sincronización automática con listas privadas de Google
    Maps.

## RF-05. Listas

-   Listas iniciales sugeridas: Pendientes, Favoritos y Visitados.
-   Crear, renombrar y eliminar listas personalizadas.
-   Añadir un lugar a varias listas.
-   Mostrar cantidad de elementos.
-   Privadas por defecto.

## RF-06. Búsqueda y filtros

-   Buscar por nombre y texto disponible.
-   Filtrar por categoría, estado, lista, ciudad y zona si existe el
    dato.
-   Ordenar por añadido recientemente, nombre y proximidad si hay
    permiso de ubicación.
-   Mantener filtros al volver de una ficha cuando sea razonable.

## RF-07. Mapa

-   Marcadores para lugares geolocalizados.
-   Panel resumido al seleccionar un marcador.
-   Acceso a ficha completa.
-   Filtros por categoría, lista y estado.
-   Agrupación de marcadores cercanos.
-   Diferenciar lugares guardados de recomendaciones.
-   Alternativa en lista.
-   Solicitar ubicación precisa solo cuando aporte valor y con permiso.

## RF-08. Ficha de lugar

Mostrar cuando existan: nombre, categoría, foto, dirección, ciudad/zona,
horarios, teléfono, web, descripción, valoración y número de reseñas
autorizados, enlace externo, fuente y fecha de actualización. Acciones:
guardar, favorito, visitado, añadir a lista, nota privada y abrir mapa.
No inventar campos ausentes ni presentar datos antiguos como actuales.

## RF-09. Descubrimiento local

-   Mostrar contenido de la ciudad activa.
-   Categorías: nuevos lugares, aperturas, recomendaciones, destacados y
    planes.
-   Filtrar por categoría y zona.
-   Explicar por qué se recomienda cuando haya una razón clara.
-   Guardar u ocultar recomendaciones.
-   Diferenciar "recién abierto", "próxima apertura", "anunciado" y
    "recomendado".
-   Mostrar fuente y fecha de verificación.

## RF-10. Agenda

-   Eventos con título, descripción, lugar, fechas, categoría y fuente.
-   Filtrar por fecha y tipo.
-   Guardar eventos.
-   Marcar eventos caducados, cancelados o en curso.

## RF-11. Viajes

-   Crear viaje con ciudad, nombre y fechas opcionales.
-   Asociar lugares y notas.
-   Consultar mapa y listas del viaje.
-   Archivar viajes pasados.
-   Aplicar preferencias globales a recomendaciones de otras ciudades.
-   Permitir explorar una ciudad sin crear un viaje.

## RF-12. Recomendaciones

-   Basarse en categorías, etiquetas e interacciones explícitas.
-   Explicar recomendaciones.
-   Permitir ajustar o desactivar personalización.
-   Evitar recomendaciones repetitivas o demasiado estrechas.

## RF-13. Notificaciones

-   Notificaciones internas inicialmente.
-   Preferencias y consentimiento para notificaciones externas.
-   No activar alertas automáticas hasta disponer de fuentes fiables.

## RF-14. Administración editorial

-   Crear y editar lugares, eventos y novedades.
-   Guardar fuente, estado de verificación y fecha de revisión.
-   Gestionar duplicados.
-   Marcar contenido como caducado o retirarlo.
-   Puede empezar como panel protegido sencillo.

------------------------------------------------------------------------

# 6. Requisitos no funcionales

-   **Responsive:** mobile-first; móvil, tablet y escritorio. No
    depender de hover.
-   **Accesibilidad:** objetivo WCAG 2.2 AA, contraste, foco visible,
    teclado, etiquetas accesibles, estados no comunicados solo por color
    y respeto a `prefers-reduced-motion`.
-   **Rendimiento:** imágenes optimizadas, carga diferida, mapa bajo
    demanda y buen comportamiento con conexiones lentas.
-   **Seguridad:** control de acceso en servidor y base de datos; un
    usuario no puede consultar datos privados de otro; validar entradas;
    no exponer secretos en frontend.
-   **Privacidad:** listas y notas privadas por defecto; exportación y
    eliminación de datos; analítica sin registrar notas privadas ni
    ubicación precisa innecesaria.
-   **Fiabilidad:** conservar fuente, fecha y estado de verificación de
    datos variables.
-   **Mantenibilidad:** separar UI, lógica de dominio y acceso a datos;
    componentes reutilizables; modelos tipados si el stack lo permite;
    tokens centralizados.
-   **Portabilidad:** no acoplar el dominio a un único proveedor de
    mapas o lugares.

------------------------------------------------------------------------

# 7. Modelo de datos conceptual

El esquema definitivo dependerá del stack y la base de datos. Entidades
recomendadas:

  -----------------------------------------------------------------------
  Entidad                 Propósito               Campos principales
  ----------------------- ----------------------- -----------------------
  `User`                  Cuenta                  id, email,
                                                  display_name,
                                                  home_city_id

  `UserPreference`        Preferencias            user_id, categorías,
                                                  etiquetas, ajustes

  `City`                  Ciudad                  id, name, slug,
                                                  country_code, región,
                                                  centro y límites

  `Trip`                  Viaje                   id, user_id, city_id,
                                                  name, fechas, status

  `Place`                 Ficha canónica          id, name, descripción,
                                                  categoría, dirección,
                                                  city_id, lat/lng, web

  `PlaceSource`           Procedencia             place_id, source_type,
                                                  URL, external_id,
                                                  checked_at

  `PlaceDataSnapshot`     Datos variables         place_id, horarios,
                                                  rating, provider,
                                                  captured_at, expires_at

  `UserPlace`             Relación personal       user_id, place_id,
                                                  status, favorite, nota,
                                                  saved_at, visited_at

  `Collection`            Lista                   id, user_id, name,
                                                  visibility

  `CollectionPlace`       Elementos de lista      collection_id,
                                                  place_id, added_at,
                                                  position

  `TripPlace`             Lugares del viaje       trip_id, place_id,
                                                  position, nota

  `Category`              Categorías              id, name, slug,
                                                  parent_id

  `Tag`                   Etiquetas               id, name, slug

  `PlaceTag`              Etiquetas de lugar      place_id, tag_id

  `Event`                 Evento                  id, title, place_id,
                                                  city_id, fechas,
                                                  source_url, status

  `DiscoveryItem`         Contenido editorial     place_id, city_id,
                                                  tipo, resumen, fecha,
                                                  verificación

  `ImportJob`             Importación             user_id, source_type,
                                                  status, contadores,
                                                  errores, fechas
  -----------------------------------------------------------------------

## Reglas de integridad

-   Una ficha canónica por lugar.
-   Un lugar puede estar en varias listas y viajes.
-   Las notas y estados personales viven en `UserPlace`, no en la ficha
    pública.
-   Los datos externos conservan procedencia y fecha.
-   Lugares sin coordenadas siguen siendo válidos.
-   La importación no crea duplicados silenciosamente.
-   Definir políticas de acceso por usuario en backend/base de datos.

------------------------------------------------------------------------

# 8. Fuentes e integraciones

## Estrategia económica del MVP

-   Google Takeout para importar guardados, tras validar el formato.
-   Alta manual y URLs compartidas.
-   Fuentes públicas locales.
-   Curación editorial manual.
-   OpenStreetMap + Leaflet, con proveedor de teselas cuyas condiciones
    permitan el uso previsto.
-   Enlaces externos a Google Maps para reseñas, horarios o navegación
    cuando no existan datos propios autorizados.

## Fuentes candidatas para Gijón

-   Ayuntamiento: https://www.gijon.es/eventos
-   Enjoy Gijón: https://enjoygijon.com/agenda-de-eventos-de-gijon/
-   Visita Gijón: https://www.visitagijon.es/eventos/
-   miGijón: https://migijon.com/

Antes de automatizar, revisar términos, licencias, RSS, APIs y
condiciones de uso. Que una página sea pública no implica permiso para
copiar masivamente su contenido.

## Google Maps / Places

-   No asumir que existe API pública para leer todas las listas
    personales guardadas.
-   Google Takeout es una vía inicial, sujeta a validar formatos.
-   Google Places puede ser una integración futura.
-   Revisar costes, atribución, límites de almacenamiento y condiciones
    de fotos/reseñas.
-   No copiar reseñas o fotografías fuera de las condiciones permitidas.

## Redes sociales

-   No prometer importación completa de guardados privados de Instagram
    o TikTok.
-   Empezar con pegar URL, añadir nota y completar manualmente el lugar.
-   Diseñar una futura captura mediante compartir si las plataformas lo
    permiten.
-   No depender de scraping no autorizado.

## Estados editoriales

-   `confirmed`: confirmado.
-   `announced`: anunciado, todavía no abierto.
-   `unverified`: pendiente de comprobar.
-   `outdated`: información antigua.
-   `closed`: cerrado.
-   `cancelled`: evento cancelado.

La interfaz debe traducir estos estados a etiquetas comprensibles.

------------------------------------------------------------------------

# 9. Identidad visual de RUVAK

## Concepto

RUVAK es un explorador urbano metamórfico: - Forma de gato cuando
explora la ciudad a pie. - Forma de grajo cuando viaja o conecta
ciudades. - Curioso, ágil, observador, astuto e independiente. - No es
una mascota infantil ni una criatura de fantasía recargada.

La lámina de personaje compartida por la usuaria es la **referencia
maestra**. Los assets futuros deben conservar su anatomía, proporciones,
mirada y lenguaje gráfico.

## Rasgos invariables

-   Negro tinta como masa principal.
-   Ojos amarillo lima eléctrico, rasgo más reconocible.
-   Silueta elegante, afilada y estilizada.
-   Formas angulares y controladas.
-   Gato de pelaje corto y definido, no esponjoso.
-   Grajo de plumaje liso, superpuesto y aerodinámico.
-   Reflejos crema/dorados muy sutiles.
-   Expresión astuta y observadora.
-   Evitar mechones desordenados, exceso de volumen y estética barroca.
-   No cambiar los ojos a naranja, dorado o verde natural.

## Personalidad verbal

Tono urbano, curioso, inteligente y cercano; ligeramente irónico cuando
encaje, sin infantilizar ni resultar invasivo.

Ejemplos: - "He encontrado algo por Cimavilla." - "Un rincón nuevo en tu
mapa." - "Esto merece una visita." - "Tu próxima parada." - "Este lugar
sigue pendiente." - "Una pista nueva para tu próxima escapada."

No afirmar que RUVAK ha visitado o probado un lugar si no es cierto.

## Paleta de marca

  -----------------------------------------------------------------------
  Token             Nombre            Hex               Uso
  ----------------- ----------------- ----------------- -----------------
  `brand-blue`      Electric blue     `#2457D6`         Acciones
                                                        principales,
                                                        enlaces activos

  `brand-orange`    Vivid orange      `#F06438`         Novedades y
                                                        avisos
                                                        editoriales

  `brand-cream`     Warm cream        `#F4F0E7`         Texto sobre
                                                        fondos oscuros y
                                                        superficies
                                                        cálidas

  `brand-ink`       Ink black         `#17191D`         Fondo y texto
                                                        principal según
                                                        contexto

  `brand-lime`      Acid lime         `#C9D84B`         Ojos, detalles de
                                                        personaje e
                                                        indicadores
                                                        puntuales
  -----------------------------------------------------------------------

### Reglas cromáticas

-   El lima es el acento icónico, no el color de todos los botones.
-   El azul identifica acciones principales e interacción.
-   El naranja destaca novedades y avisos, no todo el contenido.
-   El crema aporta contraste y calidez.
-   El negro tinta estructura la interfaz.
-   No utilizar los cinco colores con la misma intensidad en una vista.
-   Comprobar contraste WCAG en cada combinación.

### Tonos de interfaz propuestos

-   `surface-0`: `#111316`
-   `surface-1`: `#17191D`
-   `surface-2`: `#22262C`
-   `surface-3`: `#2C3138`
-   `text-primary-dark`: `#F4F0E7`

Son tonos auxiliares de UI, no sustituyen la paleta de marca. Validar el
contraste del texto secundario antes de fijarlo.

## Tipografía

-   Titulares: Space Grotesk o Archivo.
-   Texto de interfaz: Inter.
-   Serif opcional, solo para algún acento editorial puntual.
-   No utilizar demasiadas familias.
-   Evitar párrafos largos en mayúsculas.
-   Usar mayúsculas espaciadas solo en etiquetas breves.
-   Revisar licencias y carga de fuentes.

## Lenguaje gráfico

-   Editorial urbano contemporáneo.
-   Fotografía protagonista para lugares y ciudades.
-   Composición asimétrica controlada.
-   Tipografía contundente.
-   Texturas de hormigón, papel y ciudad con moderación.
-   Marcas de pintura lima como acento.
-   Siluetas de RUVAK en puntos estratégicos.
-   Evitar estética turística genérica y pines estándar sin
    personalidad.

------------------------------------------------------------------------

# 10. Sistema de diseño

## Principios

1.  Jerarquía clara y lectura rápida.
2.  Densidad de información controlada.
3.  Acciones principales reconocibles.
4.  Componentes accesibles y reutilizables.
5.  Fotografía y datos por encima de la decoración.
6.  RUVAK aparece con intención, no en cada tarjeta.
7.  Texturas solo donde no perjudiquen la legibilidad.

## Espaciado: escala de 4 px

`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 ·
`space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16`
64 px.

## Radios

`radius-xs` 4 · `radius-sm` 8 · `radius-md` 12 · `radius-lg` 16 ·
`radius-xl` 24 · `radius-pill` 999 px.

Utilizar radios moderados; evitar que toda la interfaz parezca una
colección de tarjetas excesivamente redondeadas.

## Bordes y elevación

-   Priorizar superficies y bordes antes que sombras fuertes.
-   Sombras discretas en menús y popovers.
-   Bordes carbón visibles, pero secundarios.
-   No utilizar resplandores lima como sombra estándar.

## Componentes previstos

**Estructura:** `AppShell`, `SidebarNavigation`, `BottomNavigation`,
`CitySwitcher`, `PageHeader`.

**Lugares:** `PlaceCard`, `PlaceListItem`, `PlaceHero`, `PlaceMeta`,
`PlaceStatusBadge`, `PlaceActions`, `PlaceSource`.

**Mapa:** `MapCanvas`, `MapMarker`, `MapCluster`, `MapFilterBar`,
`MapBottomSheet`, `MapLegend`.

**Colecciones:** `CollectionCard`, `CollectionGrid`, `CollectionPicker`,
`FavoriteButton`, `VisitStatusControl`.

**Descubrimiento:** `DiscoveryCard`, `NewOpeningBadge`,
`EditorialSection`, `RecommendationReason`, `DiscoveryFilters`.

**Agenda:** `EventCard`, `EventDate`, `EventStatus`, `CalendarFilter`.

**Estados:** `EmptyState`, `LoadingSkeleton`, `ErrorState`, `Toast`,
`ConfirmationDialog`, `InlineNotice`.

**Mascota:** `RuvakAvatar`, `RuvakIllustration`, `RuvakEmptyState`,
`RuvakLoader`.

## Iconografía funcional

-   SVG de trazo consistente.
-   No utilizar ilustraciones complejas para acciones pequeñas.
-   Mantener tamaño, grosor y alineación.
-   Acompañar con texto las acciones no universales.
-   No mezclar iconos lineales genéricos con iconos ilustrados de RUVAK
    en el mismo nivel de navegación.

## Fotografía

-   La fotografía real del lugar es protagonista en fichas.
-   Recortes consistentes por familia de tarjeta.
-   No presentar imágenes generadas como fotografías reales del
    establecimiento.
-   Respetar licencias y atribuciones.

## Fondos y texturas

-   Texturas para bienvenida, banners o secciones editoriales.
-   Superficies lisas en pantallas funcionales.
-   No poner texturas fuertes detrás de formularios, tablas o párrafos.
-   Fondos con espacio negativo suficiente para texto.
-   El skyline es un recurso de ambientación, no un fondo universal.

------------------------------------------------------------------------

# 11. Aplicación visual por pantalla

## Inicio

-   Ciudad activa visible.
-   Saludo editorial breve.
-   Pendientes y favoritos accesibles.
-   Bloque de novedades.
-   RUVAK en tamaño contenido como anfitrión.
-   No utilizar una ilustración gigante que desplace el contenido útil.

## Descubrir

-   Fotografía protagonista.
-   Etiquetas de categoría y estado.
-   Tarjetas editoriales con jerarquía tipográfica.
-   Lima y naranja para novedades.
-   Razón de recomendación cuando exista.
-   RUVAK en mensajes de descubrimiento, no en cada tarjeta.

## Mapa

-   Mapa con controles discretos.
-   Marcadores reconocibles y diferenciables.
-   No usar la cara completa de RUVAK como marcador universal.
-   Filtros accesibles y resultados sincronizados con el mapa.
-   En móvil, panel inferior que no tape controles esenciales.

## Ficha

-   Imagen principal.
-   Nombre, categoría, dirección y acciones rápidas.
-   Estado personal y listas.
-   Información práctica.
-   Fuente y fecha de actualización.
-   Notas privadas diferenciadas de la descripción editorial.

## Mis lugares

-   Búsqueda, filtros y listas prioritarios.
-   Alternar lista, cuadrícula y mapa cuando tenga sentido.
-   No sacrificar densidad útil por decoración.

## Agenda

-   Fechas muy visibles.
-   Estado temporal claro.
-   Tarjetas fáciles de escanear.
-   Naranja para eventos próximos con moderación.

## Viajes

-   Fotografía y nombre de ciudad.
-   Fechas y estado del viaje.
-   Resumen de lugares.
-   Mapa y colecciones.
-   RUVAK en forma de grajo como recurso narrativo entre ciudades.

## Estados vacíos y carga

-   RUVAK explica qué falta y ofrece una acción concreta.
-   Variar las poses.
-   Mensajes breves.
-   Respetar movimiento reducido.
-   No utilizar la mascota para errores graves o mensajes de privacidad.

------------------------------------------------------------------------

# 12. Inventario de assets

## Identidad

-   Icono principal.
-   Logotipo horizontal y compacto.
-   Símbolo gato/grajo.
-   Favicon.
-   App icon.
-   Avatar.

## Personaje

-   Gato: neutral, observador, curioso y desafiante.
-   Grajo: neutral, observador, curioso y desafiante.
-   Gato sentado, caminando y de espaldas.
-   Grajo posado, de perfil, de espaldas y en vuelo.
-   Secuencia de transformación.
-   Siluetas monocromas.

## Decorativos

-   Huellas.
-   Pluma.
-   Flechas.
-   Trazos de pintura.
-   Destellos.
-   Coordenadas.
-   Brújula.
-   Señales de orientación.
-   Patrones de plumaje y huellas.

## Fondos

-   Hormigón oscuro.
-   Skyline urbano.
-   Textura editorial.
-   Patrón de plumaje.
-   Bienvenida.
-   Fondos de ciudad/viaje.

## Aplicaciones

-   Splash screen.
-   Cabecera web.
-   Open Graph.
-   Stickers.
-   Loader.
-   Estados vacíos.
-   Banners y recursos sociales.

## Reglas de exportación

-   Personajes y elementos decorativos: PNG con canal alfa real.
-   Logotipos e iconos geométricos: SVG maestro y PNG de exportación.
-   Fondos: PNG o WebP según peso y calidad.
-   No aceptar cuadrícula como transparencia.
-   Verificar canal alfa y bordes sin halos.
-   Mantener anatomía y rasgos constantes.
-   Convención: `ruvak_[familia]_[variante]_[version].png`.

**Estado actual:** las láminas agrupadas y previsualizaciones generadas
son referencias de trabajo, no assets de producción validados. Separar,
limpiar y verificar transparencia antes de integrarlos.

------------------------------------------------------------------------

# 13. Alcance del MVP

## Incluido

1.  Cuenta y sesión.
2.  Ciudad habitual Gijón.
3.  Alta manual de lugares.
4.  Importación de archivo Google Takeout compatible.
5.  Listas y estados.
6.  Notas privadas.
7.  Búsqueda y filtros.
8.  Mapa de guardados.
9.  Ficha de lugar.
10. Descubrir con contenido curado manualmente.
11. Enlaces a fuentes externas.
12. Responsive.
13. Panel mínimo de administración editorial.

## Después del MVP

-   Agenda completa.
-   Viajes y ciudades.
-   Recomendaciones personalizadas.
-   Captura avanzada desde compartir URL.
-   Más fuentes de importación.
-   Automatización de novedades.
-   Notificaciones.
-   Google Places si coste y condiciones encajan.
-   PWA o aplicación nativa.

------------------------------------------------------------------------

# 14. Criterios de aceptación

El MVP estará listo para validación cuando: 1. El usuario pueda
registrarse e iniciar sesión. 2. Pueda establecer Gijón como ciudad
habitual. 3. Pueda crear un lugar con nombre y categoría. 4. Pueda
guardar una URL como referencia. 5. Pueda importar un archivo válido y
revisar la vista previa. 6. Se detecten posibles duplicados. 7. Pueda
crear listas y añadir lugares a varias listas. 8. Pueda marcar
favoritos, pendientes y visitados. 9. Pueda añadir notas privadas. 10.
Pueda buscar y filtrar. 11. Pueda ver lugares geolocalizados en el mapa.
12. Pueda abrir una ficha desde mapa y lista. 13. Pueda consultar
contenido editorial de Gijón. 14. Pueda distinguir contenido confirmado
de no verificado. 15. Pueda abrir la fuente de un dato. 16. La interfaz
funcione en móvil y escritorio. 17. Los datos privados no sean
accesibles desde otra cuenta. 18. Existan estados de carga, error y
vacío. 19. No se presenten datos inventados como reales.

------------------------------------------------------------------------

# 15. Analítica de producto

Eventos sugeridos: `account_created`, `place_created`, `place_saved`,
`place_marked_visited`, `collection_created`, `import_started`,
`import_completed`, `import_failed`, `search_performed`,
`map_marker_opened`, `discovery_item_opened`, `discovery_item_saved`,
`event_saved`, `trip_created`.

Indicadores: - Porcentaje de usuarios que añaden o importan un lugar. -
Lugares guardados por usuario activo. - Porcentaje de lugares
geolocalizados. - Uso de búsqueda y filtros. - Conversión de
recomendación a guardado. - Porcentaje de guardados que pasan a
visitados. - Errores y abandonos de importación.

No registrar notas privadas ni ubicación precisa innecesaria en
analítica.

------------------------------------------------------------------------

# 16. Riesgos y decisiones pendientes

## Riesgos

-   El formato de exportación puede variar.
-   APIs de mapas, lugares y reseñas pueden generar costes.
-   Horarios y aperturas pueden quedar obsoletos.
-   Las fuentes locales pueden tener cobertura irregular.
-   Los proveedores de mapas tienen condiciones específicas.
-   Los assets pueden perder consistencia si se reinterpretan en cada
    generación.
-   Las texturas excesivas pueden perjudicar la lectura.

## Decisiones técnicas pendientes

No asumir stack hasta auditar el repositorio: - Framework y versión. -
Lenguaje y tipado. - Sistema de estilos. - Router. - Backend y base de
datos. - Autenticación. - Hosting y despliegue. - Proveedor de
mapas/teselas. - Almacenamiento de imágenes. - Estrategia de pruebas.

## Decisiones de producto pendientes

-   Confirmar privacidad por defecto (recomendación: sí).
-   Decidir si compartir listas entra en P1.
-   Cerrar categorías iniciales.
-   Validar el formato real de Google Takeout.
-   Elegir fuentes locales y frecuencia de revisión.
-   Definir quién mantiene el contenido editorial en el MVP.

------------------------------------------------------------------------

# 17. Plan de desarrollo

## Fase 0. Auditoría técnica

Revisar repositorio, framework, dependencias, estructura y despliegue.
Identificar qué se puede reutilizar antes de decidir arquitectura.

## Fase 1. Fundamentos

Modelo de datos, autenticación, ciudad habitual, tokens de diseño, app
shell y componentes comunes.

## Fase 2. Colección

Alta/edición de lugares, listas, estados, favoritos, notas, búsqueda,
filtros e importación.

## Fase 3. Mapa y fichas

Mapa, geolocalización, marcadores, filtros, fichas y enlaces externos.

## Fase 4. Descubrimiento

Modelo editorial, administración mínima, contenido inicial de Gijón y
estados de verificación.

## Fase 5. Agenda y viajes

Eventos, ciudades, viajes y colecciones vinculadas.

## Fase 6. Calidad y lanzamiento

Responsive, accesibilidad, seguridad, rendimiento, pruebas de
importación, pruebas con usuarios, analítica y despliegue.

------------------------------------------------------------------------

# 18. Checklist para empezar

-   [ ] Auditar el repositorio y confirmar el stack.
-   [ ] Aprobar alcance del MVP.
-   [ ] Definir modelo de datos.
-   [ ] Elegir backend y autenticación.
-   [ ] Elegir proveedor de mapas y revisar condiciones.
-   [ ] Definir categorías iniciales.
-   [ ] Conseguir un archivo real de Google Takeout para pruebas.
-   [ ] Seleccionar fuentes editoriales iniciales de Gijón.
-   [ ] Crear tokens de diseño.
-   [ ] Implementar navegación responsive.
-   [ ] Implementar colección y fichas.
-   [ ] Implementar mapa.
-   [ ] Cargar contenido local inicial.
-   [ ] Validar accesibilidad, privacidad y rendimiento.

------------------------------------------------------------------------

# 19. Definición final

RUVAK conecta tres momentos:

1.  **Encontrar:** descubrir un lugar en cualquier fuente.
2.  **Guardar:** incorporarlo a una colección organizada y recuperable.
3.  **Explorar:** convertirlo en una visita, un plan o parte de un
    viaje.

Su diferenciación está en unir colección personal y descubrimiento local
proactivo, y en mantener las preferencias cuando el usuario cambia de
ciudad.

La primera versión debe demostrar que RUVAK organiza mejor los lugares
de Gijón y descubre novedades locales útiles. Después se ampliará a
viajes y automatizaciones.

**Prioridad:** construir una herramienta útil, fiable y ligera. La
identidad de RUVAK debe hacerla reconocible, pero la experiencia debe
seguir siendo rápida, clara y práctica.
