# RUVAK

Tu mapa personal de lugares: reúne los sitios que guardas en TikTok, Instagram, Google Maps o
enlaces sueltos, organízalos en listas y descubre novedades de tu ciudad. Primera ciudad: **Gijón**.

Expo SDK 58 + Expo Router (web y móvil) + Supabase.

- **Contexto y reglas del proyecto**: [CLAUDE.md](CLAUDE.md)
- **Documento de producto**: [docs/documento-producto.md](docs/documento-producto.md)
- **Documentación técnica**: [docs/](docs/)
- **Capturas**: [docs/capturas/](docs/capturas/)

## Empezar

```bash
npm install
cp .env.example .env   # y rellénalo (ver abajo)
npx expo start         # w = navegador, o escanea el QR con Expo Go
```

Sin `.env`, la app arranca y explica qué falta.

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en este orden:
   - `supabase/migrations/20261107000000_init.sql` (tablas, reglas de acceso y funciones)
   - `supabase/seed.sql` (Gijón, categorías y contenido editorial de ejemplo)

   Con la CLI de Supabase también vale: `supabase link` y `supabase db push`, y luego la semilla.
3. En **Project Settings › API**, copia la URL y la clave `anon` a `.env`. La clave `anon` es pública
   por diseño; **nunca** pongas la `service_role` en la app.
4. En **Authentication › URL Configuration**, añade a *Redirect URLs* la dirección de la app (por
   ejemplo `http://localhost:8081/**` y `ruvak://**`) para que funcionen los enlaces de confirmar
   cuenta y recuperar contraseña.
5. Para tener acceso al panel editorial, crea tu cuenta en la app y después, en el SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu@correo.com');
   ```

## Comprobar antes de dar algo por terminado

```bash
npx tsc --noEmit
npx expo lint
npm run check
bash scripts/check-rls.sh
```

`check-rls.sh` levanta un Postgres desechable, aplica la migración y la semilla y comprueba que una
cuenta no puede ver ni tocar los datos privados de otra. Necesita PostgreSQL 15+ instalado.
