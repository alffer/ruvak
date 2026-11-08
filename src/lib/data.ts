// Acceso a datos (Supabase). Las pantallas no hablan con Supabase directamente: usan estas funciones.
// Toda consulta pasa por RLS; aquí no se filtra por seguridad, solo por producto.
import { supabase } from './supabase';
import { nameKey, type DedupeCandidate } from './dedupe';
import type { ImportCandidate } from './takeout';
import type {
  Category,
  City,
  Collection,
  DiscoveryItem,
  DiscoveryKind,
  Place,
  PlaceSource,
  Profile,
  SavedPlace,
  SourceType,
  UserPlace,
  Verification,
  VisitStatus,
} from './types';

/** Lanza el error de Supabase. Tras single() el dato existe; con maybeSingle() se comprueba aparte. */
function check<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Necesitas iniciar sesión.');
  return id;
}

// ---------------------------------------------------------------------------------------------
// Mapeo de filas
// ---------------------------------------------------------------------------------------------

export function mapPlace(r: any): Place {
  return {
    id: r.id,
    name: r.name,
    nameKey: r.name_key ?? nameKey(r.name),
    description: r.description,
    categoryId: r.category_id,
    address: r.address,
    zone: r.zone,
    cityId: r.city_id,
    lat: r.lat,
    lng: r.lng,
    phone: r.phone,
    website: r.website,
    imageUrl: r.image_url,
    imageCredit: r.image_credit,
    isEditorial: r.owner_id == null,
    archived: r.archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapUserPlace(r: any): UserPlace {
  return { status: r.status, favorite: r.favorite, note: r.note ?? '', tags: r.tags ?? [], savedAt: r.saved_at, visitedAt: r.visited_at };
}

function mapSource(r: any, me: string): PlaceSource {
  return {
    id: r.id,
    sourceType: r.source_type,
    url: r.url,
    externalId: r.external_id,
    label: r.label,
    checkedAt: r.checked_at,
    createdAt: r.created_at,
    mine: r.owner_id === me,
  };
}

function mapDiscovery(r: any): DiscoveryItem {
  return {
    id: r.id,
    cityId: r.city_id,
    placeId: r.place_id,
    place: r.place ? mapPlace(r.place) : null,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    imageUrl: r.image_url,
    imageCredit: r.image_credit,
    verification: r.verification,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    verifiedAt: r.verified_at,
    startsOn: r.starts_on ?? null,
    endsOn: r.ends_on ?? null,
    published: r.published,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------------------------------------------------------------------------------------------
// Catálogos y perfil
// ---------------------------------------------------------------------------------------------

export async function getCities(): Promise<City[]> {
  const rows = check(await supabase.from('cities').select('*').order('name'));
  return (rows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    countryCode: r.country_code,
    region: r.region,
    centerLat: r.center_lat,
    centerLng: r.center_lng,
    zoom: r.zoom,
  }));
}

export async function getCategories(): Promise<Category[]> {
  const rows = check(await supabase.from('categories').select('id, name, slug').order('position'));
  return rows ?? [];
}

export async function getProfile(): Promise<{ profile: Profile; interests: number[] } | null> {
  const me = await uid();
  const row = check(await supabase.from('profiles').select('*').eq('id', me).maybeSingle());
  if (!row) return null;
  const ints = check(await supabase.from('user_interests').select('category_id'));
  return {
    profile: {
      id: row.id,
      displayName: row.display_name,
      homeCityId: row.home_city_id,
      role: row.role,
      personalizationEnabled: row.personalization_enabled,
      onboarded: row.onboarded,
    },
    interests: (ints ?? []).map((r: any) => r.category_id),
  };
}

export async function updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'homeCityId' | 'personalizationEnabled' | 'onboarded'>>) {
  const me = await uid();
  const row: Record<string, unknown> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName.trim();
  if (patch.homeCityId !== undefined) row.home_city_id = patch.homeCityId;
  if (patch.personalizationEnabled !== undefined) row.personalization_enabled = patch.personalizationEnabled;
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
  check(await supabase.from('profiles').update(row).eq('id', me));
}

export async function setInterests(categoryIds: number[]) {
  const me = await uid();
  check(await supabase.from('user_interests').delete().eq('user_id', me));
  if (categoryIds.length) check(await supabase.from('user_interests').insert(categoryIds.map((category_id) => ({ user_id: me, category_id }))));
}

// ---------------------------------------------------------------------------------------------
// Colección personal
// ---------------------------------------------------------------------------------------------

export async function getMyPlaces(): Promise<SavedPlace[]> {
  const [ups, cps] = await Promise.all([
    supabase.from('user_places').select('*, place:places(*)').order('saved_at', { ascending: false }),
    supabase.from('collection_places').select('collection_id, place_id'),
  ]);
  const byPlace = new Map<number, number[]>();
  for (const cp of check(cps) ?? []) byPlace.set(cp.place_id, [...(byPlace.get(cp.place_id) ?? []), cp.collection_id]);
  return (check(ups) ?? [])
    .filter((r: any) => r.place)
    .map((r: any) => ({ ...mapPlace(r.place), me: mapUserPlace(r), collectionIds: byPlace.get(r.place_id) ?? [] }));
}

export interface PlaceDetail {
  place: Place;
  me: UserPlace | null;
  collectionIds: number[];
  sources: PlaceSource[];
}

export async function getPlace(id: number): Promise<PlaceDetail | null> {
  const me = await uid();
  const [p, up, src, cps] = await Promise.all([
    supabase.from('places').select('*').eq('id', id).maybeSingle(),
    supabase.from('user_places').select('*').eq('place_id', id).maybeSingle(),
    supabase.from('place_sources').select('*').eq('place_id', id).order('created_at'),
    supabase.from('collection_places').select('collection_id').eq('place_id', id),
  ]);
  const row = check(p);
  if (!row) return null;
  const upRow = check(up);
  return {
    place: mapPlace(row),
    me: upRow ? mapUserPlace(upRow) : null,
    collectionIds: (check(cps) ?? []).map((r: any) => r.collection_id),
    sources: (check(src) ?? []).map((r: any) => mapSource(r, me)),
  };
}

/** Fichas visibles (editoriales + propias) con sus identificadores, para detectar duplicados. */
export async function getDedupeCandidates(): Promise<DedupeCandidate[]> {
  const rows = check(await supabase.from('places').select('id, name, address, lat, lng, place_sources(external_id, normalized_url)').eq('archived', false));
  return (rows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    externalIds: (r.place_sources ?? []).map((s: any) => s.external_id).filter(Boolean),
    normalizedUrls: (r.place_sources ?? []).map((s: any) => s.normalized_url).filter(Boolean),
  }));
}

export interface PlaceInput {
  name: string;
  description?: string | null;
  categoryId?: number | null;
  address?: string | null;
  zone?: string | null;
  cityId?: number | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  imageUrl?: string | null;
  imageCredit?: string | null;
}

export interface SourceInput {
  sourceType: SourceType;
  url?: string | null;
  normalizedUrl?: string | null;
  externalId?: string | null;
  label?: string | null;
  /** Cuándo se comprobó el dato de esta fuente (ISO). Sin valor, solo las editoriales llevan fecha. */
  checkedAt?: string | null;
}

function placeRow(p: PlaceInput) {
  const clean = (v: string | null | undefined) => (v == null ? null : v.trim() || null);
  return {
    name: p.name.trim(),
    description: clean(p.description),
    category_id: p.categoryId ?? null,
    address: clean(p.address),
    zone: clean(p.zone),
    city_id: p.cityId ?? null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    phone: clean(p.phone),
    website: clean(p.website),
    image_url: clean(p.imageUrl),
    image_credit: clean(p.imageCredit),
  };
}

/** Crea una ficha. Privada (del usuario) salvo `editorial`, que solo pueden usar administradores. */
export async function createPlace(
  input: PlaceInput,
  opts: { source?: SourceInput; note?: string; collectionIds?: number[]; editorial?: boolean } = {},
): Promise<number> {
  const me = await uid();
  const row = check(
    await supabase
      .from('places')
      .insert({ ...placeRow(input), owner_id: opts.editorial ? null : me })
      .select('id')
      .single(),
  );
  const id = row.id as number;
  const source = opts.source ?? { sourceType: opts.editorial ? 'editorial' : 'manual' };
  await addSource(id, source, !!opts.editorial);
  if (!opts.editorial) {
    await savePlace(id, opts.note);
    if (opts.collectionIds?.length) await setPlaceCollections(id, opts.collectionIds);
  }
  return id;
}

export async function updatePlace(id: number, input: PlaceInput) {
  check(await supabase.from('places').update(placeRow(input)).eq('id', id));
}

export async function setPlaceArchived(id: number, archived: boolean) {
  check(await supabase.from('places').update({ archived }).eq('id', id));
}

export async function addSource(placeId: number, s: SourceInput, editorial = false) {
  const me = await uid();
  check(
    await supabase.from('place_sources').insert({
      place_id: placeId,
      owner_id: editorial ? null : me,
      source_type: s.sourceType,
      url: s.url ?? null,
      normalized_url: s.normalizedUrl ?? null,
      external_id: s.externalId ?? null,
      label: s.label ?? null,
      checked_at: s.checkedAt ?? (editorial ? new Date().toISOString() : null),
    }),
  );
}

export async function deleteSource(id: number) {
  check(await supabase.from('place_sources').delete().eq('id', id));
}

/** Guarda una ficha en la colección (sin tocar estado/nota si ya estaba guardada). */
export async function savePlace(placeId: number, note?: string) {
  const me = await uid();
  check(await supabase.from('user_places').upsert({ user_id: me, place_id: placeId }, { onConflict: 'user_id,place_id', ignoreDuplicates: true }));
  if (note?.trim()) await appendNote(placeId, note.trim());
}

async function appendNote(placeId: number, note: string) {
  const row = check(await supabase.from('user_places').select('note').eq('place_id', placeId).single());
  const current = (row?.note ?? '').trim();
  if (current.includes(note)) return;
  check(
    await supabase
      .from('user_places')
      .update({ note: current ? `${current}\n${note}` : note })
      .eq('place_id', placeId),
  );
}

/** Quita el lugar de la colección: estado, nota y listas. Una ficha privada propia se borra. */
export async function unsavePlace(placeId: number, deletePrivatePlace: boolean) {
  const me = await uid();
  if (deletePrivatePlace) {
    check(await supabase.from('places').delete().eq('id', placeId).eq('owner_id', me));
    return;
  }
  const cols = check(await supabase.from('collections').select('id'));
  const ids = (cols ?? []).map((c: any) => c.id);
  if (ids.length) check(await supabase.from('collection_places').delete().eq('place_id', placeId).in('collection_id', ids));
  check(await supabase.from('user_places').delete().eq('place_id', placeId).eq('user_id', me));
}

export async function updateUserPlace(placeId: number, patch: Partial<{ status: VisitStatus | null; favorite: boolean; note: string; tags: string[] }>) {
  const me = await uid();
  await savePlace(placeId);
  const row: Record<string, unknown> = { ...patch };
  if (patch.status !== undefined) row.visited_at = patch.status === 'visited' ? new Date().toISOString() : null;
  check(await supabase.from('user_places').update(row).eq('place_id', placeId).eq('user_id', me));
}

// ---------------------------------------------------------------------------------------------
// Listas personalizadas
// ---------------------------------------------------------------------------------------------

export async function getCollections(): Promise<Collection[]> {
  const rows = check(await supabase.from('collections').select('id, name, created_at, collection_places(count)').order('created_at'));
  return (rows ?? []).map((r: any) => ({ id: r.id, name: r.name, createdAt: r.created_at, count: r.collection_places?.[0]?.count ?? 0 }));
}

export async function createCollection(name: string): Promise<number> {
  const me = await uid();
  const row = check(await supabase.from('collections').insert({ user_id: me, name: name.trim() }).select('id').single());
  return row.id;
}

export async function renameCollection(id: number, name: string) {
  check(await supabase.from('collections').update({ name: name.trim() }).eq('id', id));
}

export async function deleteCollection(id: number) {
  check(await supabase.from('collections').delete().eq('id', id));
}

/** Deja el lugar exactamente en estas listas (y lo guarda si no lo estaba). */
export async function setPlaceCollections(placeId: number, collectionIds: number[]) {
  await savePlace(placeId);
  const current = check(await supabase.from('collection_places').select('collection_id').eq('place_id', placeId));
  const have = new Set<number>((current ?? []).map((r: any) => r.collection_id));
  const want = new Set(collectionIds);
  const add = [...want].filter((id) => !have.has(id));
  const remove = [...have].filter((id) => !want.has(id));
  if (add.length) check(await supabase.from('collection_places').insert(add.map((collection_id) => ({ collection_id, place_id: placeId }))));
  if (remove.length) check(await supabase.from('collection_places').delete().eq('place_id', placeId).in('collection_id', remove));
}

// ---------------------------------------------------------------------------------------------
// Descubrir
// ---------------------------------------------------------------------------------------------

export async function getDiscovery(cityId: number, opts: { includeHidden?: boolean; includeDrafts?: boolean } = {}): Promise<DiscoveryItem[]> {
  let q = supabase.from('discovery_items').select('*, place:places(*)').eq('city_id', cityId).order('created_at', { ascending: false });
  if (!opts.includeDrafts) q = q.eq('published', true);
  const [items, hidden] = await Promise.all([
    q,
    opts.includeHidden ? Promise.resolve({ data: [], error: null }) : supabase.from('hidden_discovery').select('item_id'),
  ]);
  const hiddenIds = new Set((check(hidden) ?? []).map((r: any) => r.item_id));
  return (check(items) ?? []).filter((r: any) => !hiddenIds.has(r.id)).map(mapDiscovery);
}

export async function hideDiscovery(itemId: number) {
  const me = await uid();
  check(await supabase.from('hidden_discovery').upsert({ user_id: me, item_id: itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true }));
}

export async function unhideAllDiscovery() {
  const me = await uid();
  check(await supabase.from('hidden_discovery').delete().eq('user_id', me));
}

export interface DiscoveryInput {
  cityId: number;
  placeId: number | null;
  kind: DiscoveryKind;
  title: string;
  summary: string;
  imageUrl: string | null;
  imageCredit: string | null;
  verification: Verification;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedAt: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  published: boolean;
}

export async function saveDiscovery(id: number | null, d: DiscoveryInput): Promise<number> {
  const me = await uid();
  const row = {
    city_id: d.cityId,
    place_id: d.placeId,
    kind: d.kind,
    title: d.title.trim(),
    summary: d.summary.trim(),
    image_url: d.imageUrl?.trim() || null,
    image_credit: d.imageCredit?.trim() || null,
    verification: d.verification,
    source_name: d.sourceName?.trim() || null,
    source_url: d.sourceUrl?.trim() || null,
    verified_at: d.verifiedAt || null,
    starts_on: d.startsOn || null,
    ends_on: d.endsOn || null,
    published: d.published,
  };
  if (id) {
    check(await supabase.from('discovery_items').update(row).eq('id', id));
    return id;
  }
  const r = check(
    await supabase
      .from('discovery_items')
      .insert({ ...row, created_by: me })
      .select('id')
      .single(),
  );
  return r.id;
}

/** Confirma que una apertura anunciada ya está abierta: recién abierto, confirmado, revisado hoy y publicado. */
export async function confirmDiscoveryOpened(id: number) {
  const today = new Date().toISOString().slice(0, 10);
  check(await supabase.from('discovery_items').update({ kind: 'just_opened', verification: 'confirmed', verified_at: today, published: true }).eq('id', id));
}

/** Sube una foto de una novedad al bucket público y devuelve su URL. Solo administradores (RLS). */
export async function uploadDiscoveryImage(localUri: string, mimeType: string | null | undefined): Promise<string> {
  const me = await uid();
  const blob = await (await fetch(localUri)).blob();
  const ext = (mimeType ?? 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${me}/${Date.now()}.${ext}`;
  check(await supabase.storage.from('discovery-images').upload(path, blob, { contentType: mimeType ?? 'image/jpeg', upsert: false }));
  return supabase.storage.from('discovery-images').getPublicUrl(path).data.publicUrl;
}

/** Publica o retira un contenido. Solo lo usa la pestaña Revisar y el panel de contenido (RLS lo limita a administradores). */
export async function setDiscoveryPublished(id: number, published: boolean) {
  check(await supabase.from('discovery_items').update({ published }).eq('id', id));
}

export async function deleteDiscovery(id: number) {
  check(await supabase.from('discovery_items').delete().eq('id', id));
}

export async function getEditorialPlaces(): Promise<Place[]> {
  const rows = check(await supabase.from('places').select('*').is('owner_id', null).order('name'));
  return (rows ?? []).map(mapPlace);
}

// ---------------------------------------------------------------------------------------------
// Importación
// ---------------------------------------------------------------------------------------------

/** Qué hacer con cada elemento de la vista previa. */
export type ImportDecision = { kind: 'new' } | { kind: 'link'; placeId: number } | { kind: 'skip' };

export interface ImportOutcome {
  imported: number;
  linked: number;
  skipped: number;
  errors: string[];
}

export async function runImport(
  fileName: string,
  items: ImportCandidate[],
  decisions: Map<number, ImportDecision>,
  cityId: number | null,
  onProgress?: (done: number) => void,
): Promise<ImportOutcome> {
  const me = await uid();
  const out: ImportOutcome = { imported: 0, linked: 0, skipped: 0, errors: [] };
  const listIds = new Map<string, number>();
  const existingLists = await getCollections();
  async function listFor(name: string | null): Promise<number[]> {
    if (!name) return [];
    if (!listIds.has(name)) {
      const found = existingLists.find((c) => c.name === name);
      listIds.set(name, found ? found.id : await createCollection(name));
    }
    return [listIds.get(name)!];
  }
  let done = 0;
  for (const it of items) {
    const d = decisions.get(it.index) ?? { kind: 'skip' };
    try {
      const source: SourceInput = {
        sourceType: 'google_takeout',
        url: it.url,
        normalizedUrl: it.normalizedUrl,
        externalId: it.externalId,
        label: fileName,
      };
      if (d.kind === 'skip') out.skipped++;
      else if (d.kind === 'new') {
        await createPlace(
          { name: it.name, address: it.address, lat: it.lat, lng: it.lng, cityId },
          { source, note: it.note ?? undefined, collectionIds: await listFor(it.listName) },
        );
        out.imported++;
      } else {
        await savePlace(d.placeId, it.note ?? undefined);
        await addSource(d.placeId, source);
        const lists = await listFor(it.listName);
        if (lists.length) {
          const cur = check(await supabase.from('collection_places').select('collection_id').eq('place_id', d.placeId));
          await setPlaceCollections(d.placeId, [...new Set([...(cur ?? []).map((r: any) => r.collection_id), ...lists])]);
        }
        out.linked++;
      }
    } catch (e) {
      out.errors.push(`${it.name}: ${(e as Error).message}`);
    }
    onProgress?.(++done);
  }
  await supabase.from('import_jobs').insert({
    user_id: me,
    source_type: 'google_takeout',
    file_name: fileName,
    status: out.errors.length && !out.imported && !out.linked ? 'failed' : 'completed',
    total: items.length,
    imported: out.imported,
    linked: out.linked,
    skipped: out.skipped,
    errors: out.errors,
    finished_at: new Date().toISOString(),
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Privacidad: exportar y borrar
// ---------------------------------------------------------------------------------------------

export async function exportMyData(): Promise<string> {
  const me = await uid();
  const tables = ['profiles', 'user_interests', 'user_places', 'collections', 'collection_places', 'hidden_discovery', 'import_jobs'] as const;
  const out: Record<string, unknown> = { exportado: new Date().toISOString(), app: 'RUVAK' };
  for (const t of tables) out[t] = check(await supabase.from(t).select('*'));
  out.places_propios = check(await supabase.from('places').select('*').eq('owner_id', me));
  out.fuentes_propias = check(await supabase.from('place_sources').select('*').eq('owner_id', me));
  return JSON.stringify(out, null, 2);
}

export async function deleteMyAccount() {
  check(await supabase.rpc('delete_my_account'));
  await supabase.auth.signOut();
}
