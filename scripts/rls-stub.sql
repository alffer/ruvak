-- Mínimo de Supabase para probar las migraciones en un Postgres normal (solo pruebas locales):
-- roles anon/authenticated, esquema auth con users y auth.uid() leyendo el JWT simulado.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema public, auth to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant usage, select on sequences to authenticated;
grant execute on function auth.uid() to anon, authenticated;
