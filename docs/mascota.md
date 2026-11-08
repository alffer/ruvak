# Mascota: RUVAK

Explorador urbano metamórfico: **gato** a pie por la ciudad y **grajo** entre ciudades. Negro tinta, ojos lima
eléctrico, reflejos crema/dorados. Rasgos invariables: documento de producto §9.

## Archivos

- `assets/ruvak/originales/`: las imágenes de la usuaria, **tal cual** (no se tocan).
- `assets/ruvak/ruvak_[familia]_[variante]_v1.webp`: assets de producción. Los genera
  `node scripts/prepare-ruvak.mjs` (recorta el margen transparente y limita a 900 px, 1600 px la secuencia).
- `assets/icon.png`, `android-icon-foreground.png`, `favicon.png`, `splash-icon.png`: la cabeza del gato sobre negro
  tinta o transparente, generados por el mismo script.

Los originales ya traían canal alfa real (sin cuadrícula ni halos; comprobado al importarlos). Solo se escalan,
recortan y componen: **nunca se redibujan**.

## Poses disponibles (`src/components/Ruvak.tsx`)

| Pose | Original | Dónde |
| ---- | -------- | ----- |
| `gato-cabeza` | gato-cabeza.webp | Avatar: cabecera de las pestañas, saludo de Inicio, Descubrir; iconos de la app |
| `gato-sentado` | gato-sentado-astuto.webp | Entrar; estados vacíos |
| `transformacion` | transformacion-gato-grajo.webp | Bienvenida (gato en tu ciudad, grajo cuando viajes) |
| `grajo-vuelo` | grajo-vuelo.webp | Viajes |
| `grajo-ataque` | grajo-ataque.webp | Disponible, sin usar todavía |
| (generadas, sin conectar aún) | gato-sorprendido, gato-sentado-mirada, gato-caminando, gato-de-pie, gato-sentado-perfil | `ruvak_gato_{sorprendido,mirada,caminando,de-pie,perfil}_v1.webp`; falta añadirlas a `POSES` y usarlas en pantallas |

Para añadir una pose: original en `originales/`, entrada en `CHARACTER` de `prepare-ruvak.mjs`, ejecutar el script
y añadirla a `POSES` en `Ruvak.tsx`.

## Reglas de uso

- Decorativa: oculta a lectores de pantalla; el texto lleva el mensaje.
- No aparece en tarjetas, marcadores del mapa, errores graves ni mensajes de privacidad.
- Variar poses en estados vacíos cuando haya más (dormido para «vacío», sorprendido para «novedad»…).
