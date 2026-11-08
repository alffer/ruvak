-- RUVAK · esquema inicial (MVP)
-- Modelo conceptual: docs/datos.md. Seguridad: toda tabla con datos personales tiene RLS y las
-- políticas se limitan a auth.uid(). Un usuario nunca puede leer datos privados de otro.

-- ---------------------------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------------------------

-- Clave normalizada de un nombre para detectar duplicados: minúsculas, sin tildes, sin signos.
-- Debe coincidir con nameKey() de src/lib/dedupe.ts (comprobado en scripts/check-dedupe.ts).
create or replace function public.ruvak_name_key(input text)
returns text
language sql
immutable
parallel safe
as $$
  select trim(both ' ' from regexp_replace(
    translate(lower(coalesce(input, '')),
      'áàäâãéèëêíìïîóòöôõúùüûñç',
      'aaaaaeeeeiiiiooooouuuunc'),
    '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Catálogos públicos: ciudades y categorías
-- ---------------------------------------------------------------------------------------------

create table public.cities (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  country_code char(2) not null,
  region text,
  center_lat double precision not null,
  center_lng double precision not null,
  zoom smallint not null default 13,
  -- Límites [sur, oeste, norte, este]; opcional.
  bounds double precision[]
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  parent_id bigint references public.categories (id) on delete set null,
  position smallint not null default 0
);

-- ---------------------------------------------------------------------------------------------
-- Perfil (1:1 con auth.users)
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  home_city_id bigint references public.cities (id) on delete set null,
  role text not null default 'user' check (role in ('user', 'admin')),
  personalization_enabled boolean not null default true,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_interests (
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id bigint not null references public.categories (id) on delete cascade,
  primary key (user_id, category_id)
);

-- ¿El usuario actual es administrador editorial? security definer para no depender de RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------------------------
-- Lugares: una ficha canónica por lugar
-- owner_id NULL  → ficha editorial/pública (solo la crean administradores).
-- owner_id = uid → ficha privada creada por ese usuario (alta manual, URL o importación).
-- ---------------------------------------------------------------------------------------------

create table public.places (
  id bigint generated always as identity primary key,
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  name_key text generated always as (public.ruvak_name_key(name)) stored,
  description text,
  category_id bigint references public.categories (id) on delete set null,
  address text,
  zone text,
  city_id bigint references public.cities (id) on delete set null,
  -- Un lugar puede existir sin coordenadas.
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  phone text,
  website text,
  image_url text,
  image_credit text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
create index places_owner_idx on public.places (owner_id);
create index places_city_idx on public.places (city_id);
create index places_name_key_idx on public.places (name_key);
create trigger places_touch before update on public.places for each row execute function public.touch_updated_at();

-- Procedencia de la ficha. owner_id NULL = fuente editorial visible para todos;
-- owner_id = uid = fuente aportada por ese usuario (p. ej. el TikTok donde lo vio), solo visible para él.
create table public.place_sources (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.places (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('manual', 'url', 'google_maps', 'instagram', 'tiktok', 'google_takeout', 'editorial', 'other')),
  url text,
  normalized_url text,
  external_id text,
  label text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index place_sources_place_idx on public.place_sources (place_id);
create index place_sources_ext_idx on public.place_sources (external_id);
create index place_sources_url_idx on public.place_sources (normalized_url);

-- Relación personal con un lugar: estado, favorito, nota privada y etiquetas.
-- Nunca se guarda nada de esto en la ficha pública.
create table public.user_places (
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id bigint not null references public.places (id) on delete cascade,
  status text check (status in ('pending', 'visited', 'discarded')),
  favorite boolean not null default false,
  note text not null default '',
  tags text[] not null default '{}',
  saved_at timestamptz not null default now(),
  visited_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
create index user_places_place_idx on public.user_places (place_id);
create trigger user_places_touch before update on public.user_places for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Listas personalizadas
-- ---------------------------------------------------------------------------------------------

create table public.collections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  visibility text not null default 'private' check (visibility in ('private')),
  created_at timestamptz not null default now()
);
create index collections_user_idx on public.collections (user_id);

create table public.collection_places (
  collection_id bigint not null references public.collections (id) on delete cascade,
  place_id bigint not null references public.places (id) on delete cascade,
  added_at timestamptz not null default now(),
  position integer not null default 0,
  primary key (collection_id, place_id)
);
create index collection_places_place_idx on public.collection_places (place_id);

-- ---------------------------------------------------------------------------------------------
-- Descubrir (contenido editorial curado)
-- ---------------------------------------------------------------------------------------------

create table public.discovery_items (
  id bigint generated always as identity primary key,
  city_id bigint not null references public.cities (id) on delete cascade,
  place_id bigint references public.places (id) on delete set null,
  kind text not null check (kind in ('just_opened', 'upcoming_opening', 'announced', 'recommended', 'featured', 'plan')),
  title text not null,
  summary text not null default '',
  image_url text,
  image_credit text,
  verification text not null default 'unverified' check (verification in ('confirmed', 'announced', 'unverified', 'outdated', 'closed', 'cancelled')),
  source_name text,
  source_url text,
  verified_at date,
  published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index discovery_city_idx on public.discovery_items (city_id, published);
create trigger discovery_touch before update on public.discovery_items for each row execute function public.touch_updated_at();

-- Recomendaciones que el usuario ha ocultado.
create table public.hidden_discovery (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id bigint not null references public.discovery_items (id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------------------------------------
-- Importaciones
-- ---------------------------------------------------------------------------------------------

create table public.import_jobs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null,
  file_name text not null default '',
  status text not null default 'completed' check (status in ('completed', 'failed')),
  total integer not null default 0,
  imported integer not null default 0,
  linked integer not null default 0,
  skipped integer not null default 0,
  errors jsonb not null default '[]',
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index import_jobs_user_idx on public.import_jobs (user_id);

-- ---------------------------------------------------------------------------------------------
-- Alta de cuenta: perfil con Gijón como ciudad habitual.
-- Las listas sugeridas (Pendientes, Favoritos, Visitados) no se guardan aquí: son vistas de los
-- estados de user_places, así nunca se desincronizan (ver docs/decisiones.md).
-- ---------------------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, home_city_id)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    (select id from public.cities where slug = 'gijon')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Baja de cuenta: borra el usuario y, en cascada, todos sus datos.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.places enable row level security;
alter table public.place_sources enable row level security;
alter table public.user_places enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.discovery_items enable row level security;
alter table public.hidden_discovery enable row level security;
alter table public.import_jobs enable row level security;

-- Catálogos: lectura pública, escritura solo admin.
create policy cities_read on public.cities for select using (true);
create policy cities_admin on public.cities for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perfil: cada uno el suyo. El rol no se puede cambiar desde el cliente (ver privilegios abajo).
create policy profiles_own_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy interests_own on public.user_interests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Lugares: editoriales visibles para todos los usuarios; privados solo para su creador.
create policy places_read on public.places for select to authenticated
  using (owner_id is null or owner_id = auth.uid() or public.is_admin());
create policy places_insert on public.places for insert to authenticated
  with check (owner_id = auth.uid() or (owner_id is null and public.is_admin()));
create policy places_update on public.places for update to authenticated
  using (owner_id = auth.uid() or (owner_id is null and public.is_admin()))
  with check (owner_id = auth.uid() or (owner_id is null and public.is_admin()));
create policy places_delete on public.places for delete to authenticated
  using (owner_id = auth.uid() or (owner_id is null and public.is_admin()));

-- Fuentes: las editoriales de fichas visibles, y las propias.
create policy sources_read on public.place_sources for select to authenticated
  using (
    owner_id = auth.uid()
    or (owner_id is null and exists (select 1 from public.places p where p.id = place_id and (p.owner_id is null or p.owner_id = auth.uid())))
    or public.is_admin()
  );
create policy sources_insert on public.place_sources for insert to authenticated
  with check (
    (owner_id = auth.uid() and exists (select 1 from public.places p where p.id = place_id and (p.owner_id is null or p.owner_id = auth.uid())))
    or (owner_id is null and public.is_admin())
  );
create policy sources_modify on public.place_sources for update to authenticated
  using (owner_id = auth.uid() or (owner_id is null and public.is_admin()))
  with check (owner_id = auth.uid() or (owner_id is null and public.is_admin()));
create policy sources_delete on public.place_sources for delete to authenticated
  using (owner_id = auth.uid() or (owner_id is null and public.is_admin()));

-- Relación personal: solo el propio usuario, y solo con fichas que puede ver.
create policy user_places_own on public.user_places for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.places p where p.id = place_id and (p.owner_id is null or p.owner_id = auth.uid())));

-- Listas y sus elementos: solo el dueño de la lista.
create policy collections_own on public.collections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy collection_places_own on public.collection_places for all to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()))
  with check (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
    and exists (select 1 from public.places p where p.id = place_id and (p.owner_id is null or p.owner_id = auth.uid()))
  );

-- Descubrir: publicado visible para usuarios con sesión; gestión solo admin.
create policy discovery_read on public.discovery_items for select to authenticated
  using (published or public.is_admin());
create policy discovery_admin on public.discovery_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy hidden_own on public.hidden_discovery for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy import_jobs_own on public.import_jobs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- Privilegios: el cliente (rol authenticated) no puede cambiarse el rol ni crear perfiles ajenos.
-- ---------------------------------------------------------------------------------------------

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, home_city_id, personalization_enabled, onboarded) on public.profiles to authenticated;

-- Sin sesión solo se leen los catálogos públicos (además de RLS, como segunda barrera).
revoke all on all tables in schema public from anon;
grant select on public.cities, public.categories to anon;
