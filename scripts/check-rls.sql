-- Comprueba el aislamiento entre cuentas y las reglas editoriales (criterio de aceptación 17).
-- Se ejecuta con scripts/check-rls.sh sobre un Postgres local. Cualquier fallo corta la ejecución.
\set ON_ERROR_STOP on

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.com', '{"display_name":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.com', '{}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000ad';

create function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid, false);
$$;

set role authenticated;

-- ---- Ana: perfil, listas sugeridas, lugar privado, nota y lista ----
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a') \g /dev/null
do $$
declare n int; pid bigint; cid bigint; editorial bigint;
begin
  select count(*) into n from public.profiles;
  assert n = 1, 'Ana solo debe ver su perfil';
  assert (select display_name from public.profiles) = 'Ana', 'nombre visible desde metadatos';
  assert (select home_city_id from public.profiles) = (select id from public.cities where slug = 'gijon'), 'Gijón como ciudad habitual';

  insert into public.places (owner_id, name, address) values (auth.uid(), 'Café Secreto de Ana', 'Calle X 1') returning id into pid;
  assert (select name_key from public.places where id = pid) = 'cafe secreto de ana', 'name_key normalizado';
  insert into public.place_sources (place_id, owner_id, source_type, url) values (pid, auth.uid(), 'tiktok', 'https://www.tiktok.com/@ana/video/1');
  insert into public.user_places (user_id, place_id, status, note) values (auth.uid(), pid, 'pending', 'nota privada de Ana');
  insert into public.collections (user_id, name) values (auth.uid(), 'Cafés para trabajar') returning id into cid;
  insert into public.collection_places (collection_id, place_id) values (cid, pid);

  -- Ana también guarda una ficha editorial con su propia nota.
  select id into editorial from public.places where owner_id is null order by id limit 1;
  insert into public.user_places (user_id, place_id, favorite, note) values (auth.uid(), editorial, true, 'otra nota de Ana');

  -- Ana NO puede crear fichas editoriales ni descubrimientos, ni hacerse admin.
  begin
    insert into public.places (owner_id, name) values (null, 'Intento editorial');
    raise exception 'FALLO: un usuario normal creó una ficha editorial';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.discovery_items (city_id, kind, title) values (1, 'recommended', 'x');
    raise exception 'FALLO: un usuario normal creó contenido de Descubrir';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'admin';
    raise exception 'FALLO: un usuario pudo cambiarse el rol';
  exception when insufficient_privilege then null;
  end;
  -- Ana no puede editar fichas editoriales.
  update public.places set name = 'pirateado' where owner_id is null;
  assert not exists (select 1 from public.places where name = 'pirateado'), 'FALLO: editó una ficha editorial';
end $$;

-- ---- Beto: no ve nada privado de Ana ----
reset role;
select set_config('test.anapid', (select id::text from public.places where name = 'Café Secreto de Ana'), false) \g /dev/null
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b') \g /dev/null
do $$
declare n int; anapid bigint; betocid bigint;
begin
  assert not exists (select 1 from public.places where name = 'Café Secreto de Ana'), 'FALLO: Beto ve un lugar privado de Ana';
  assert not exists (select 1 from public.place_sources where url like '%tiktok%'), 'FALLO: Beto ve una fuente privada de Ana';
  select count(*) into n from public.user_places;
  assert n = 0, 'FALLO: Beto ve estados o notas de Ana';
  select count(*) into n from public.collections;
  assert n = 0, 'FALLO: Beto ve listas de Ana';
  insert into public.collections (user_id, name) values (auth.uid(), 'Lista de Beto');
  select count(*) into n from public.collection_places;
  assert n = 0, 'FALLO: Beto ve elementos de listas de Ana';
  select count(*) into n from public.profiles;
  assert n = 1, 'FALLO: Beto ve otros perfiles';
  -- Sí ve las fichas editoriales y su fuente editorial.
  select count(*) into n from public.places where owner_id is null;
  assert n > 0, 'Beto debe ver las fichas editoriales';
  select count(*) into n from public.discovery_items;
  assert n > 0, 'Beto debe ver el contenido publicado';

  -- Beto no puede meter el lugar de Ana en su lista ni marcarlo (aunque adivine el id).
  anapid := current_setting('test.anapid')::bigint;
  select id into betocid from public.collections limit 1;
  begin
    insert into public.collection_places (collection_id, place_id) values (betocid, anapid);
    raise exception 'FALLO: Beto añadió a su lista un lugar privado de Ana';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.user_places (user_id, place_id) values (auth.uid(), anapid);
    raise exception 'FALLO: Beto guardó un lugar privado de Ana';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.user_places (user_id, place_id) values ('00000000-0000-0000-0000-00000000000a', 1);
    raise exception 'FALLO: Beto escribió en nombre de Ana';
  exception when insufficient_privilege then null;
  end;
  -- Ni borrar ni modificar nada de Ana.
  update public.places set name = 'x' where id = anapid;
  delete from public.places where id = anapid;
  delete from public.collections where user_id <> auth.uid();
end $$;

-- ---- Comprobación como superusuario: lo de Ana sigue intacto ----
reset role;
do $$
begin
  assert (select name from public.places where name = 'Café Secreto de Ana') is not null, 'FALLO: Beto borró el lugar de Ana';
  assert (select count(*) from public.collections where user_id = '00000000-0000-0000-0000-00000000000a') = 1, 'FALLO: Beto borró listas de Ana';
end $$;

-- ---- Admin: puede crear contenido editorial y verlo sin publicar ----
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad') \g /dev/null
do $$
declare pid bigint;
begin
  insert into public.places (owner_id, name, city_id) values (null, 'Nueva ficha editorial', 1) returning id into pid;
  insert into public.discovery_items (city_id, place_id, kind, title, published) values (1, pid, 'announced', 'Borrador', false);
  assert exists (select 1 from public.discovery_items where title = 'Borrador'), 'admin ve borradores';
  -- El admin tampoco ve notas privadas de otros usuarios.
  assert not exists (select 1 from public.user_places), 'FALLO: el admin ve notas privadas';
end $$;

-- Un usuario normal no ve borradores.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b') \g /dev/null
do $$ begin
  assert not exists (select 1 from public.discovery_items where title = 'Borrador'), 'FALLO: borrador visible';
end $$;

-- ---- Anónimo: no ve datos de usuario (ni por permisos ni por RLS) ----
set role anon;
select pg_temp.as_user('') \g /dev/null
do $$
declare t text; n int;
begin
  assert exists (select 1 from public.cities), 'anon ve ciudades';
  foreach t in array array['places', 'place_sources', 'user_places', 'collections', 'collection_places', 'profiles', 'import_jobs', 'discovery_items'] loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      assert n = 0, format('FALLO: anon ve %s filas de %s', n, t);
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

-- ---- Baja de cuenta: borra todo lo de Ana ----
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a') \g /dev/null
select public.delete_my_account() \g /dev/null
reset role;
do $$ begin
  assert not exists (select 1 from public.places where name = 'Café Secreto de Ana'), 'FALLO: quedan lugares de Ana';
  assert not exists (select 1 from public.user_places where user_id = '00000000-0000-0000-0000-00000000000a'), 'FALLO: quedan notas de Ana';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'FALLO: queda el perfil de Ana';
end $$;

\echo 'check-rls: todas las comprobaciones pasan'
