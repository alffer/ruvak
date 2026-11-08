-- RUVAK · datos iniciales
-- Ciudad habitual (Gijón), categorías iniciales y un contenido editorial MÍNIMO DE EJEMPLO.
--
-- Los lugares de ejemplo son lugares reales y conocidos de Gijón, pero:
--   · las coordenadas son aproximadas,
--   · no se incluyen horarios, teléfonos, valoraciones ni aperturas,
--   · todo va marcado como «unverified» (Sin verificar) y con la fuente «Datos de ejemplo».
-- El equipo editorial debe revisarlos (o retirarlos) antes del lanzamiento.

insert into public.cities (name, slug, country_code, region, center_lat, center_lng, zoom, bounds)
values ('Gijón', 'gijon', 'ES', 'Asturias', 43.5357, -5.6615, 13, array[43.49, -5.75, 43.56, -5.56])
on conflict (slug) do nothing;

insert into public.categories (name, slug, position) values
  ('Cafeterías', 'cafeterias', 1),
  ('Restaurantes', 'restaurantes', 2),
  ('Bares y sidrerías', 'bares', 3),
  ('Tiendas independientes', 'tiendas', 4),
  ('Librerías', 'librerias', 5),
  ('Espacios culturales', 'cultura', 6),
  ('Museos', 'museos', 7),
  ('Exposiciones', 'exposiciones', 8),
  ('Mercados y mercadillos', 'mercados', 9),
  ('Talleres', 'talleres', 10),
  ('Parques y naturaleza', 'naturaleza', 11),
  ('Playas', 'playas', 12),
  ('Miradores y paseos', 'miradores', 13),
  ('Otros', 'otros', 99)
on conflict (slug) do nothing;

-- Fichas editoriales de ejemplo (owner_id NULL = públicas).
with c as (select id from public.cities where slug = 'gijon'),
data (name, cat, zone, lat, lng, description) as (
  values
    ('Elogio del Horizonte', 'miradores', 'Cimavilla', 43.5470, -5.6630,
     'Escultura de Eduardo Chillida en lo alto del Cerro de Santa Catalina.'),
    ('Termas romanas de Campo Valdés', 'museos', 'Cimavilla', 43.5450, -5.6612,
     'Restos de unas termas públicas romanas junto a la playa de San Lorenzo.'),
    ('Museo Casa Natal de Jovellanos', 'museos', 'Cimavilla', 43.5446, -5.6640,
     'Casa natal de Gaspar Melchor de Jovellanos, hoy museo.'),
    ('Universidad Laboral', 'cultura', 'Cabueñes', 43.5240, -5.6140,
     'Gran conjunto arquitectónico de mediados del siglo XX, obra de Luis Moya.'),
    ('Jardín Botánico Atlántico', 'naturaleza', 'Cabueñes', 43.5225, -5.6180,
     'Jardín botánico dedicado a la flora del arco atlántico.'),
    ('Acuario de Gijón', 'museos', 'Poniente', 43.5418, -5.6735,
     'Acuario junto a la playa de Poniente.'),
    ('Museo del Ferrocarril de Asturias', 'museos', 'Calzada', 43.5402, -5.6720,
     'Museo dedicado a la historia del ferrocarril en Asturias.'),
    ('Playa de San Lorenzo', 'playas', 'Centro', 43.5420, -5.6530,
     'La gran playa urbana de Gijón, con el paseo del Muro.'),
    ('Parque de Isabel la Católica', 'naturaleza', 'La Arena', 43.5383, -5.6398,
     'Parque urbano junto al final de la playa de San Lorenzo.')
)
insert into public.places (owner_id, name, description, category_id, zone, city_id, lat, lng)
select null, d.name, d.description, (select id from public.categories where slug = d.cat), d.zone, (select id from c), d.lat, d.lng
from data d
where not exists (select 1 from public.places p where p.owner_id is null and p.name = d.name);

insert into public.place_sources (place_id, owner_id, source_type, label)
select p.id, null, 'editorial', 'Datos de ejemplo de RUVAK · coordenadas aproximadas, pendiente de verificar'
from public.places p
where p.owner_id is null
  and not exists (select 1 from public.place_sources s where s.place_id = p.id and s.owner_id is null);

-- Descubrir: destacados y planes de ejemplo, sin afirmar aperturas ni novedades.
with c as (select id from public.cities where slug = 'gijon'),
data (place, kind, title, summary) as (
  values
    ('Elogio del Horizonte', 'featured', 'Atardecer en el Cerro de Santa Catalina',
     'Sube a la escultura de Chillida y recorre el cerro. Aquí tienes una pista por Cimavilla.'),
    ('Termas romanas de Campo Valdés', 'recommended', 'Gijón romano bajo la plaza',
     'Unas termas romanas en pleno barrio alto. Esto merece una visita.'),
    ('Universidad Laboral', 'featured', 'Arquitectura monumental en Cabueñes',
     'Un conjunto enorme para recorrer con calma. Tu próxima parada fuera del centro.'),
    ('Jardín Botánico Atlántico', 'plan', 'Plan verde en Cabueñes',
     'Combina el Jardín Botánico con la Universidad Laboral, que está al lado.'),
    ('Museo del Ferrocarril de Asturias', 'recommended', 'Trenes históricos junto a Poniente',
     'Un museo para quienes buscan algo distinto cerca de la playa de Poniente.')
)
insert into public.discovery_items (city_id, place_id, kind, title, summary, verification, source_name, published)
select (select id from c), p.id, d.kind, d.title, d.summary, 'unverified', 'Datos de ejemplo de RUVAK (pendiente de verificar)', true
from data d
join public.places p on p.owner_id is null and p.name = d.place
where not exists (select 1 from public.discovery_items i where i.title = d.title);
