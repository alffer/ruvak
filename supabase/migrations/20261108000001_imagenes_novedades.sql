-- RUVAK · fotos de las novedades. Bucket público de lectura; solo administradores suben, cambian o borran.
insert into storage.buckets (id, name, public)
values ('discovery-images', 'discovery-images', true)
on conflict (id) do nothing;

drop policy if exists "admin sube fotos de novedades" on storage.objects;
drop policy if exists "admin cambia fotos de novedades" on storage.objects;
drop policy if exists "admin borra fotos de novedades" on storage.objects;

create policy "admin sube fotos de novedades" on storage.objects for insert to authenticated
  with check (bucket_id = 'discovery-images' and public.is_admin());
create policy "admin cambia fotos de novedades" on storage.objects for update to authenticated
  using (bucket_id = 'discovery-images' and public.is_admin());
create policy "admin borra fotos de novedades" on storage.objects for delete to authenticated
  using (bucket_id = 'discovery-images' and public.is_admin());
