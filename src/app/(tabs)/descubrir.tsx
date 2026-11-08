import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { DiscoveryCard } from '@/components/Place';
import { RuvakEmptyState, RuvakIllustration } from '@/components/Ruvak';
import { Card, Chip, ChipRow, ErrorState, H1, InlineNotice, LinkButton, Row, Screen, SearchField, SkeletonList } from '@/components/ui';
import { getDiscovery, getMyPlaces, hideDiscovery, savePlace, unhideAllDiscovery } from '@/lib/data';
import { nameKey } from '@/lib/dedupe';
import { rankDiscovery, reasonFor } from '@/lib/recommend';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import type { DiscoveryItem, DiscoveryKind } from '@/lib/types';
import { useLoad } from '@/lib/useLoad';

type KindFilter = 'all' | 'news' | 'recommended' | 'featured' | 'plan';
const KIND_FILTERS: { key: KindFilter; label: string; kinds: DiscoveryKind[] }[] = [
  { key: 'all', label: 'Todo', kinds: [] },
  { key: 'news', label: 'Aperturas y anuncios', kinds: ['just_opened', 'upcoming_opening', 'announced'] },
  { key: 'recommended', label: 'Recomendados', kinds: ['recommended'] },
  { key: 'featured', label: 'Destacados', kinds: ['featured'] },
  { key: 'plan', label: 'Planes', kinds: ['plan'] },
];

/** Búsqueda de texto sobre título, resumen, lugar, zona y categoría (sin tildes ni mayúsculas). */
function matches(i: DiscoveryItem, q: string, categoryName: (id: number | null) => string | null): boolean {
  const terms = nameKey(q).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const hay = nameKey([i.title, i.summary, i.place?.name, i.place?.zone, categoryName(i.place?.categoryId ?? null)].filter(Boolean).join(' '));
  return terms.every((t) => hay.includes(t));
}

/** Explorar: contenido editorial curado de la ciudad activa (RF-09). */
export default function Discover() {
  const { activeCity, profile, interests, categories, bump } = useSession();
  const categoryName = useCategoryName();
  const items = useLoad(() => (activeCity ? getDiscovery(activeCity.id) : Promise.resolve([])), [activeCity?.id]);
  const saved = useLoad(getMyPlaces, []);
  const [kind, setKind] = useState<KindFilter>('all');
  // Texto y categoría viven en la dirección: así llegan desde Inicio (buscador y accesos) y se conservan al volver.
  const params = useLocalSearchParams<{ q?: string; cat?: string }>();
  const query = params.q ?? '';
  const categoryId = params.cat ? Number(params.cat) || null : null;
  const setCategoryId = (id: number | null) => router.setParams({ cat: id == null ? '' : String(id) });
  const [zone, setZone] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const savedIds = useMemo(() => new Set((saved.data ?? []).map((p) => p.id)), [saved.data]);
  const ctx = { personalizationEnabled: !!profile?.personalizationEnabled, interestIds: interests, categoryName, saved: saved.data ?? [] };
  const ranked = rankDiscovery(items.data ?? [], ctx);
  const zones = [...new Set(ranked.map((i) => i.place?.zone).filter((z): z is string => !!z))].sort();
  const usedCats = categories.filter((c) => ranked.some((i) => i.place?.categoryId === c.id));
  const kinds = KIND_FILTERS.find((k) => k.key === kind)!.kinds;
  const activeFilters = (categoryId != null ? 1 : 0) + (zone ? 1 : 0);
  const clearFilters = () => {
    setCategoryId(null);
    setZone(null);
  };
  const visible = ranked.filter(
    (i) =>
      (!kinds.length || kinds.includes(i.kind)) &&
      (categoryId == null || i.place?.categoryId === categoryId) &&
      matches(i, query, categoryName) &&
      (!zone || nameKey(i.place?.zone) === nameKey(zone)),
  );

  async function onSave(placeId: number, title: string) {
    await savePlace(placeId);
    setMessage(`«${title}» guardado en Mis lugares.`);
    bump();
  }
  async function onHide(id: number) {
    await hideDiscovery(id);
    setMessage('Recomendación oculta.');
    items.reload();
  }

  return (
    <Screen>
      <Row gap={space[3]} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1, gap: space[1] }}>
          <H1>Explorar</H1>
          <Text style={[typography.subtitle, { color: colors.textSecondary }]}>Aquí tienes algunas pistas por {activeCity?.name ?? 'tu ciudad'}.</Text>
        </View>
        <RuvakIllustration pose="gato-mirada" height={96} />
      </Row>

      {/* key: al llegar con otro texto desde Inicio, el campo arranca con él. */}
      <ExploreSearch key={query} initial={query} />

      <View style={{ gap: space[1] }}>
        <ChipRow>
          {usedCats.length > 1 || zones.length > 1 ? (
            <Chip
              label={activeFilters ? `Filtros (${activeFilters})` : 'Filtros'}
              icon="filters"
              selected={activeFilters > 0}
              onPress={() => setShowFilters(!showFilters)}
            />
          ) : null}
          {KIND_FILTERS.map((k) => (
            <Chip key={k.key} label={k.label} selected={kind === k.key} quiet={k.key === 'all'} onPress={() => setKind(k.key)} />
          ))}
        </ChipRow>
        {showFilters ? (
          <Card>
            {usedCats.length > 1 ? (
              <>
                <Text style={[typography.label, { color: colors.text }]}>Categoría</Text>
                <Row wrap>
                  {usedCats.map((c) => (
                    <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(categoryId === c.id ? null : c.id)} />
                  ))}
                </Row>
              </>
            ) : null}
            {zones.length > 1 ? (
              <>
                <Text style={[typography.label, { color: colors.text }]}>Zona</Text>
                <Row wrap>
                  {zones.map((z) => (
                    <Chip key={z} label={z} icon="pin" selected={zone === z} onPress={() => setZone(zone === z ? null : z)} />
                  ))}
                </Row>
              </>
            ) : null}
            {activeFilters ? <LinkButton label="Quitar filtros" onPress={clearFilters} /> : null}
          </Card>
        ) : null}
      </View>

      {message ? <InlineNotice tone="success">{message}</InlineNotice> : null}
      {items.error ? <ErrorState message={items.error} onRetry={items.reload} /> : null}
      {items.loading && !items.data ? <SkeletonList rows={3} /> : null}

      {items.data && !visible.length ? (
        <RuvakEmptyState
          title={ranked.length ? 'Nada con estos filtros' : 'Todavía no hay pistas aquí'}
          text={ranked.length ? 'Prueba con otra categoría o zona.' : 'El equipo editorial irá publicando lugares, aperturas y planes de esta ciudad.'}
          secondary={<LinkButton label="Mostrar lo que ocultaste" onPress={() => unhideAllDiscovery().then(items.reload)} />}
        />
      ) : null}

      <View style={{ gap: space[4] }}>
        {visible.map((i) => (
          <DiscoveryCard
            key={i.id}
            item={i}
            reason={reasonFor(i, ctx)}
            saved={i.placeId != null && savedIds.has(i.placeId)}
            onSave={() => i.placeId != null && onSave(i.placeId, i.place?.name ?? i.title)}
            onHide={() => onHide(i.id)}
          />
        ))}
      </View>
      {visible.length ? <LinkButton label="Mostrar lo que ocultaste" onPress={() => unhideAllDiscovery().then(items.reload)} /> : null}
    </Screen>
  );
}

function ExploreSearch({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  return (
    <SearchField
      value={text}
      onChangeText={(t) => {
        setText(t);
        if (!t && initial) router.setParams({ q: '' });
      }}
      onSubmit={() => router.setParams({ q: text.trim() })}
      placeholder="Busca lugares, planes o ideas…"
      label="Buscar en Explorar"
    />
  );
}
