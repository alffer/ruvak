# Mascota: RUVAK

Explorador urbano metamórfico: **gato** a pie por la ciudad y **grajo** entre ciudades. Negro tinta, ojos lima
eléctrico, siluetas afiladas. Rasgos invariables: documento de producto §9.

## Estado actual: provisional

`src/components/Ruvak.tsx` dibuja **siluetas geométricas provisionales** (SVG) porque la lámina maestra del
personaje no está en el repositorio. No son el diseño final ni pretenden reinterpretarlo.

Para integrar los assets reales:

1. Separar y limpiar los PNG desde la lámina maestra (canal alfa real, sin halos, sin cuadrícula como transparencia).
2. Guardarlos en `assets/ruvak/` con la convención `ruvak_[familia]_[variante]_[version].png`.
3. Sustituir el SVG de `RuvakAvatar` por `<Image>` de `expo-image` manteniendo la API (`form`, `size`).

## Dónde aparece

| Lugar | Forma |
| ----- | ----- |
| Entrar, bienvenida, Inicio (saludo), Descubrir (cabecera) | Gato, tamaño contenido |
| Estados vacíos (`RuvakEmptyState`) | Gato |
| Viajes | Grajo |

No aparece en tarjetas, marcadores del mapa, errores graves ni mensajes de privacidad.
