-- RUVAK · fechas de los eventos temporales (exposiciones, conciertos, festivales…)
-- Un plan sin fecha de fin no se muestra: solo se ven los eventos vigentes o futuros.
alter table public.discovery_items
  add column if not exists starts_on date,
  add column if not exists ends_on date;
