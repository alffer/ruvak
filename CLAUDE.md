# RUVAK: contexto para trabajar en el proyecto

App de descubrimiento local y colección de lugares (primera ciudad: Gijón). Expo SDK 58 + Expo
Router (web, Android e iOS desde el mismo código) con **Supabase** como backend: cuentas, base de
datos Postgres y reglas de acceso por usuario (RLS). Mismo stack y forma de trabajar que Sandow.

Lee primero esto y después el documento de `docs/` que toque. El documento de producto completo
(requisitos, prioridades, sistema de diseño) está en `docs/documento-producto.md`. **Mantén esta
documentación al día en el mismo commit que cualquier cambio de comportamiento, estructura o decisión.**

## Reglas de trabajo

- **Idioma**: la app y la documentación están en castellano; habla con la usuaria en castellano.
- **Nada de `git push`, despliegues ni compilaciones sin aprobación expresa.** Se commitea en local y se pregunta.
- **Marca**: colores, espaciado y tipografía solo desde `src/lib/tokens.ts`; nada de HEX sueltos. Hay dos temas (oscuro y claro): los estilos con color van en `themed(() => StyleSheet.create(...))`. Referencia: maquetas y lámina de la usuaria (ver `docs/diseno.md`).
- **Revisión UX antes de presentar (norma de la usuaria)**: todo cambio visual lo revisa primero un agente
  experto en UX (subagente) y se corrige antes de enseñárselo. Criterios: facilidad de comprensión,
  usabilidad, eficiencia (pocos pasos y pocos botones por pantalla), jerarquía de la información, contraste
  AAA (≥ 7:1 en texto), objetivos táctiles, estados vacíos/carga/error, móvil y escritorio, tema claro y
  oscuro, y que no se presente nada inventado. Se pasan las capturas de `docs/capturas/` y se mide el
  contraste con números. Se resume en la respuesta qué encontró y qué se cambió.
- **Accesibilidad** (objetivo WCAG 2.2 AA, texto AAA donde se pueda): contraste medido en `tokens.ts`,
  objetivos táctiles de 48 px, etiquetas accesibles, foco visible y nunca un estado solo con color.
- **Datos**: no se inventan horarios, aperturas, reseñas ni fotos. Todo dato variable lleva fuente y
  fecha. Lo no comprobado se marca «Sin verificar». La mascota no afirma haber visitado nada.
- **Privacidad**: notas, estados y listas viven en tablas propias del usuario con RLS. Cualquier tabla
  nueva con datos personales necesita políticas y una comprobación en `scripts/check-rls.sql`.
- **Mascota**: ilustraciones en `assets/ruvak/`, generadas desde `assets/ruvak/originales/` con
  `node scripts/prepare-ruvak.mjs`. Solo se escalan y recortan; nunca se redibujan (ver `docs/mascota.md`).
- **Expo cambia mucho**: antes de usar una API de Expo, consulta la documentación de la versión
  instalada (ver `AGENTS.md`). Instala con `npx expo install`.

## Comandos

```bash
npx expo start                 # desarrollo (w = web, a = Android con Expo Go)
npx tsc --noEmit               # tipos
npx expo lint                  # lint
npm run format                 # Prettier (npm run format:check solo comprueba)
npm run check                  # lógica pura: duplicados, Takeout, URLs y filtros
bash scripts/check-rls.sh      # migración + semilla + aislamiento entre cuentas en un Postgres local
node scripts/capture-screens.mjs # capturas a docs/capturas (ver cabecera del script)
```

Antes de dar algo por terminado: `tsc`, `lint`, `npm run check`, `check-rls.sh` si tocas SQL, y que
compilen los bundles (`npx expo export --platform web` y `--platform android --no-bytecode`).

## Documentación

| Documento                                            | Contenido                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| [docs/documento-producto.md](docs/documento-producto.md) | Documento de producto, requisitos y sistema de diseño (original) |
| [docs/producto.md](docs/producto.md)                 | Qué hace hoy la app, pantallas y estado de cada requisito     |
| [docs/arquitectura.md](docs/arquitectura.md)         | Stack, carpetas, rutas, librerías y por qué                   |
| [docs/datos.md](docs/datos.md)                       | Esquema de Supabase, RLS, semilla y cómo administrar          |
| [docs/diseno.md](docs/diseno.md)                     | Tokens, contraste, componentes y reglas visuales              |
| [docs/mascota.md](docs/mascota.md)                   | RUVAK (gato/grajo): dónde aparece y cómo integrar los assets  |
| [docs/decisiones.md](docs/decisiones.md)             | Decisiones tomadas y su motivo                                |
| [docs/pendiente.md](docs/pendiente.md)               | Próximas fases y decisiones abiertas                          |
| [docs/capturas/](docs/capturas/)                     | Capturas de cada pantalla con datos de ejemplo (móvil y escritorio) |
