import { router } from 'expo-router';
import { lazy, Suspense, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton } from '@/components/Icon';
import type { MapMarker } from '@/components/map/mapShared';
import { PlaceListItem, PlaceStatusBadge } from '@/components/Place';
import { Badge, Button, Chip, ChipRow, ErrorState, Loading, P, Row, Segmented } from '@/components/ui';
import { getCollections, getDiscovery, getMyPlaces } from '@/lib/data';
import { EMPTY_FILTERS, filterPlaces, type StatusFilter } from '@/lib/filters';
import { plural } from '@/lib/format';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, elevation, layout, radii, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

// El mapa (Leaflet) se carga solo al abrir esta pestaña (§6 Rendimiento: mapa bajo demanda).
const MapCanvas = lazy(() => import('@/components/map/MapCanvas'));

const STATUS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'favorites', label: 'Favoritos' },
  { key: 'visited', label: 'Visitados' },
];

export default function MapScreen() {
  const { activeCity, categories } = useSession();
  const categoryName = useCategoryName();
  const places = useLoad(getMyPlaces, []);
  const lists = useLoad(getCollections, []);
  const discovery = useLoad(() => (activeCity ? getDiscovery(activeCity.id) : Promise.resolve([])), [activeCity?.id]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showSaved, setShowSaved] = useState(true);
  const [showDiscovery, setShowDiscovery] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [selected, setSelected] = useState<MapMarker | null>(null);

  const filtered = useMemo(
    () => filterPlaces(places.data ?? [], { ...EMPTY_FILTERS, status, categoryId, collectionId, cityId: activeCity?.id ?? null }, categoryName),
    [places.data, status, categoryId, collectionId, activeCity?.id, categoryName],
  );
  const savedIds = new Set((places.data ?? []).map((p) => p.id));
  const withCoords = filtered.filter((p) => p.lat != null && p.lng != null);
  const withoutCoords = filtered.length - withCoords.length;
  const recs = (discovery.data ?? []).filter(
    (i) => i.place && i.place.lat != null && i.place.lng != null && !savedIds.has(i.place.id) && (categoryId == null || i.place.categoryId === categoryId),
  );

  const markers: MapMarker[] = useMemo(
    () => [
      ...(showSaved
        ? withCoords.map((p) => ({
            id: p.id,
            kind: 'saved' as const,
            lat: p.lat!,
            lng: p.lng!,
            title: p.name,
            subtitle: categoryName(p.categoryId) ?? undefined,
          }))
        : []),
      // Las recomendaciones no dependen de estado ni lista (no son tuyas todavía).
      ...(showDiscovery && status === 'all' && collectionId == null
        ? recs.map((i) => ({ id: i.place!.id, kind: 'discovery' as const, lat: i.place!.lat!, lng: i.place!.lng!, title: i.place!.name, subtitle: i.title }))
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showSaved, showDiscovery, withCoords.length, recs.length, status, collectionId, filtered, discovery.data],
  );

  const selPlace = selected?.kind === 'saved' ? (places.data ?? []).find((p) => p.id === selected.id) : null;
  const selRec = selected?.kind === 'discovery' ? recs.find((i) => i.place?.id === selected.id) : null;
  const center = activeCity ? { lat: activeCity.centerLat, lng: activeCity.centerLng, zoom: activeCity.zoom } : { lat: 43.5357, lng: -5.6615, zoom: 13 };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.bar}>
        <Row gap={space[2]} wrap style={{ justifyContent: 'space-between' }}>
          <Segmented
            label="Vista"
            value={view}
            onChange={setView}
            options={[
              { value: 'map', label: 'Mapa', icon: 'map' },
              { value: 'list', label: 'Lista', icon: 'list' },
            ]}
          />
          <MapLegend />
        </Row>
        <ChipRow>
          <Chip label="Mis lugares" selected={showSaved} onPress={() => setShowSaved(!showSaved)} />
          <Chip label="Recomendaciones" selected={showDiscovery} onPress={() => setShowDiscovery(!showDiscovery)} />
          {STATUS.map((s) => (
            <Chip key={s.key} label={s.label} selected={status === s.key} onPress={() => setStatus(s.key)} />
          ))}
        </ChipRow>
        <ChipRow>
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(categoryId === c.id ? null : c.id)} />
          ))}
          {(lists.data ?? []).map((l) => (
            <Chip
              key={`l${l.id}`}
              label={l.name}
              icon="list"
              selected={collectionId === l.id}
              onPress={() => setCollectionId(collectionId === l.id ? null : l.id)}
            />
          ))}
        </ChipRow>
        {withoutCoords > 0 ? (
          <P
            muted
            style={{ fontSize: 13 }}
          >{`${plural(withoutCoords, 'lugar', 'lugares')} sin ubicación no ${withoutCoords === 1 ? 'aparece' : 'aparecen'} en el mapa (sí en la lista).`}</P>
        ) : null}
      </View>

      {places.error ? (
        <View style={{ padding: space[4] }}>
          <ErrorState message={places.error} onRetry={places.reload} />
        </View>
      ) : view === 'list' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length ? (
            filtered.map((p) => <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />)
          ) : (
            <P muted>No hay lugares con estos filtros.</P>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <Suspense fallback={<Loading label="Cargando mapa…" />}>
            <MapCanvas markers={markers} center={center} selected={selected} onSelect={setSelected} fitToMarkers={false} />
          </Suspense>
          {selected && (selPlace || selRec) ? (
            // Panel inferior: no tapa los controles de zoom (arriba a la izquierda).
            <View style={styles.sheet} accessibilityLiveRegion="polite">
              <Row gap={space[2]} style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: space[1] }}>
                  {selRec ? <Badge label="Recomendación de RUVAK" tone="news" icon="sparkles" /> : null}
                  <Text style={[typography.cardTitle, { color: colors.text }]}>{selPlace?.name ?? selRec?.place?.name}</Text>
                  <P muted style={{ fontSize: 14 }}>
                    {[categoryName((selPlace ?? selRec?.place)?.categoryId ?? null), (selPlace ?? selRec?.place)?.zone].filter(Boolean).join(' · ')}
                  </P>
                  {selPlace?.me.status ? <PlaceStatusBadge status={selPlace.me.status} /> : null}
                </View>
                <IconButton name="x" label="Cerrar panel" onPress={() => setSelected(null)} />
              </Row>
              <Button title="Ver ficha" icon="chevron-right" onPress={() => router.push(`/lugar/${selected.id}`)} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** Leyenda: forma + texto, no solo color. */
function MapLegend() {
  return (
    <Row gap={space[3]} accessibilityLabel="Leyenda: círculo azul, mis lugares; rombo naranja, recomendaciones">
      <Row gap={space[1]}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.markerSaved, borderWidth: 2, borderColor: colors.text }} />
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Mis lugares</Text>
      </Row>
      <Row gap={space[1]}>
        <View
          style={{ width: 11, height: 11, transform: [{ rotate: '45deg' }], backgroundColor: colors.markerDiscovery, borderWidth: 2, borderColor: colors.text }}
        />
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Recomendaciones</Text>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  bar: {
    padding: space[3],
    gap: space[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
    maxWidth: layout.maxContent,
    alignSelf: 'center',
  },
  list: { padding: space[4], gap: space[3], width: '100%', maxWidth: layout.maxContent, alignSelf: 'center' },
  sheet: {
    position: 'absolute',
    left: space[3],
    right: space[3],
    bottom: space[3],
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: space[4],
    gap: space[3],
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    ...elevation.popover,
  },
});
