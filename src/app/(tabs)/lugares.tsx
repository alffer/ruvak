import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { PlaceListItem } from '@/components/Place';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Button, Card, Chip, ChipRow, ErrorState, Field, InlineNotice, LinkButton, P, Row, Screen, Segmented, SkeletonList, ToggleRow } from '@/components/ui';
import { createCollection, getCollections, getMyPlaces } from '@/lib/data';
import {
  countActive,
  EMPTY_FILTERS,
  filterPlaces,
  inSmartList,
  SMART_LISTS,
  sortPlaces,
  zonesOf,
  type PlaceFilters,
  type SortKey,
  type StatusFilter,
} from '@/lib/filters';
import { plural } from '@/lib/format';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, iconSize, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

const STATUS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'favorites', label: 'Favoritos' },
  { key: 'visited', label: 'Visitados' },
  { key: 'none', label: 'Sin estado' },
  { key: 'discarded', label: 'Descartados' },
];

/** Mis lugares: colección global (no depende de la ciudad activa), búsqueda, filtros y listas. */
export default function MyPlaces() {
  const { categories, bump } = useSession();
  const categoryName = useCategoryName();
  const places = useLoad(getMyPlaces, []);
  const lists = useLoad(getCollections, []);
  const [tab, setTab] = useState<'places' | 'lists'>('places');
  // El estado vive en la pestaña: al volver de una ficha se conservan los filtros (RF-06).
  const [f, setF] = useState<PlaceFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [newList, setNewList] = useState('');
  const [listError, setListError] = useState<string | null>(null);

  const set = (patch: Partial<PlaceFilters>) => setF((cur) => ({ ...cur, ...patch }));
  const result = useMemo(() => sortPlaces(filterPlaces(places.data ?? [], f, categoryName), sort), [places.data, f, sort, categoryName]);
  const zones = useMemo(() => zonesOf(places.data ?? []), [places.data]);
  const active = countActive(f);
  const total = (places.data ?? []).filter((p) => !p.archived).length;

  async function addList() {
    const name = newList.trim();
    if (!name) return setListError('Ponle un nombre a la lista.');
    if ((lists.data ?? []).some((l) => l.name.toLowerCase() === name.toLowerCase())) return setListError('Ya tienes una lista con ese nombre.');
    try {
      await createCollection(name);
      setNewList('');
      setListError(null);
      lists.reload();
      bump();
    } catch (e) {
      setListError((e as Error).message);
    }
  }

  return (
    <Screen>
      <Row gap={space[2]} wrap style={{ justifyContent: 'space-between' }}>
        <Segmented
          label="Sección"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'places', label: 'Lugares', icon: 'bookmark' },
            { value: 'lists', label: 'Listas', icon: 'list' },
          ]}
        />
        <Row gap={space[2]}>
          <Button title="Importar" icon="upload" variant="secondary" onPress={() => router.push('/importar')} />
          <Button title="Añadir" icon="plus" onPress={() => router.push('/lugar/nuevo')} />
        </Row>
      </Row>

      {places.error ? <ErrorState message={places.error} onRetry={places.reload} /> : null}

      {tab === 'places' ? (
        <>
          <View style={{ gap: space[2] }}>
            <Field
              label="Buscar en mis lugares"
              placeholder="Nombre, categoría, zona o nota"
              value={f.q}
              onChangeText={(q) => set({ q })}
              returnKeyType="search"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            <ChipRow>
              {STATUS.map((s) => (
                <Chip key={s.key} label={s.label} selected={f.status === s.key} onPress={() => set({ status: s.key })} />
              ))}
            </ChipRow>
            <Row gap={space[2]} wrap style={{ justifyContent: 'space-between' }}>
              <LinkButton
                label={showFilters ? 'Ocultar filtros' : active ? `Más filtros (${active} activos)` : 'Más filtros'}
                onPress={() => setShowFilters(!showFilters)}
              />
              <Segmented
                label="Ordenar"
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'recent', label: 'Recientes' },
                  { value: 'name', label: 'Nombre' },
                ]}
              />
            </Row>
            {showFilters ? (
              <Card>
                <Text style={[typography.label, { color: colors.text }]}>Categoría</Text>
                <Row wrap>
                  {categories.map((c) => (
                    <Chip key={c.id} label={c.name} selected={f.categoryId === c.id} onPress={() => set({ categoryId: f.categoryId === c.id ? null : c.id })} />
                  ))}
                </Row>
                {zones.length ? (
                  <>
                    <Text style={[typography.label, { color: colors.text }]}>Zona</Text>
                    <Row wrap>
                      {zones.map((z) => (
                        <Chip key={z} label={z} icon="pin" selected={f.zone === z} onPress={() => set({ zone: f.zone === z ? null : z })} />
                      ))}
                    </Row>
                  </>
                ) : null}
                <ToggleRow label="Solo con ubicación" value={f.onlyWithLocation} onChange={(v) => set({ onlyWithLocation: v })} />
                <ToggleRow label="Mostrar archivados" value={f.showArchived} onChange={(v) => set({ showArchived: v })} />
                {active || f.q ? (
                  <Button title="Quitar filtros" variant="ghost" icon="x" onPress={() => setF(EMPTY_FILTERS)} style={{ alignSelf: 'flex-start' }} />
                ) : null}
              </Card>
            ) : null}
          </View>

          {places.loading && !places.data ? <SkeletonList /> : null}
          {places.data ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]} accessibilityLiveRegion="polite">
              {result.length === total && !f.q ? plural(total, 'lugar', 'lugares') : `${plural(result.length, 'resultado', 'resultados')} de ${total}`}
            </Text>
          ) : null}
          {places.data && total === 0 ? (
            <RuvakEmptyState
              title="Aún no has guardado nada"
              text="Empieza por ese sitio que viste en redes y no quieres olvidar."
              action={{ label: 'Añadir lugar', onPress: () => router.push('/lugar/nuevo') }}
              secondary={<LinkButton label="O importa tus guardados de Google" onPress={() => router.push('/importar')} />}
            />
          ) : null}
          {places.data && total > 0 && !result.length ? <InlineNotice>No hay lugares que coincidan. Prueba a quitar algún filtro.</InlineNotice> : null}
          <View style={{ gap: space[3] }}>
            {result.map((p) => (
              <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />
            ))}
          </View>
        </>
      ) : (
        <View style={{ gap: space[3] }}>
          <P muted>Pendientes, Favoritos y Visitados se rellenan solos con el estado de cada lugar.</P>
          {SMART_LISTS.map((s) => (
            <ListRow
              key={s.key}
              name={s.name}
              count={(places.data ?? []).filter((p) => !p.archived && inSmartList(p, s.key)).length}
              onPress={() => router.push(`/lista/${s.key}`)}
              smart
            />
          ))}
          {lists.error ? <ErrorState message={lists.error} onRetry={lists.reload} /> : null}
          {(lists.data ?? []).map((l) => (
            <ListRow key={l.id} name={l.name} count={l.count} onPress={() => router.push(`/lista/${l.id}`)} />
          ))}
          <Card>
            <Field
              label="Nueva lista"
              placeholder="Ej.: Cafés para trabajar"
              value={newList}
              onChangeText={setNewList}
              onSubmitEditing={addList}
              error={listError}
            />
            <Button title="Crear lista" icon="plus" variant="secondary" onPress={addList} style={{ alignSelf: 'flex-start' }} />
            <P muted style={{ fontSize: 13 }}>
              Las listas son privadas: solo las ves tú.
            </P>
          </Card>
        </View>
      )}
    </Screen>
  );
}

function ListRow({ name, count, onPress, smart }: { name: string; count: number; onPress: () => void; smart?: boolean }) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${name}, ${plural(count, 'lugar', 'lugares')}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}
    >
      <Icon name={smart ? 'bookmark-check' : 'list'} color={smart ? colors.lime : colors.blueText} size={iconSize.lg} />
      <Text style={[typography.cardTitle, { color: colors.text, flex: 1 }]}>{name}</Text>
      <Text style={[typography.label, { color: colors.textSecondary }]}>{count}</Text>
      <Icon name="chevron-right" color={colors.textSecondary} />
    </Card>
  );
}
