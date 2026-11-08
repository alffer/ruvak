import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { IconName } from '@/components/Icon';
import { CategoryShortcut, PlaceListItem, RecommendedCard } from '@/components/Place';
import { RuvakEmptyState, RuvakIllustration } from '@/components/Ruvak';
import { ErrorState, P, Row, Screen, SearchField, SectionHeader, SkeletonList } from '@/components/ui';
import { getDiscovery, getMyPlaces } from '@/lib/data';
import { rankDiscovery } from '@/lib/recommend';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/** Accesos rápidos de la lámina; se resuelven por el slug de la categoría de la semilla. */
const SHORTCUTS: { slug: string; label: string; icon: IconName }[] = [
  { slug: 'cafeterias', label: 'Cafés', icon: 'coffee' },
  { slug: 'librerias', label: 'Librerías', icon: 'book' },
  { slug: 'restaurantes', label: 'Restaurantes', icon: 'utensils' },
  { slug: 'cultura', label: 'Cultura', icon: 'ticket' },
];

/** Inicio (lámina): portada «Descubre Gijón_», buscador, categorías y recomendados; después, lo tuyo. */
export default function Home() {
  const { profile, activeCity, interests, categories } = useSession();
  const categoryName = useCategoryName();
  const places = useLoad(getMyPlaces, []);
  const discovery = useLoad(() => (activeCity ? getDiscovery(activeCity.id) : Promise.resolve([])), [activeCity?.id]);
  const [q, setQ] = useState('');

  const all = (places.data ?? []).filter((p) => !p.archived);
  // Por visitar: guardados que aún no has marcado como visitados ni descartados. Los favoritos primero.
  const toVisit = all
    .filter((p) => p.me.status !== 'visited' && p.me.status !== 'discarded')
    .sort((a, b) => Number(b.me.favorite) - Number(a.me.favorite) || b.me.savedAt.localeCompare(a.me.savedAt));
  // Próximas aperturas y eventos: novedades publicadas de la ciudad (aperturas y planes).
  const UPCOMING = ['just_opened', 'upcoming_opening', 'announced', 'plan'];
  const upcoming = rankDiscovery(discovery.data ?? [], {
    personalizationEnabled: !!profile?.personalizationEnabled,
    interestIds: interests,
    categoryName,
    saved: all,
  })
    .filter((i) => UPCOMING.includes(i.kind))
    .slice(0, 8);
  const city = activeCity?.name ?? 'tu ciudad';

  const search = () => router.navigate({ pathname: '/descubrir', params: q.trim() ? { q: q.trim() } : {} });
  const goCategory = (slug: string) => {
    const id = categories.find((c) => c.slug === slug)?.id;
    router.navigate({ pathname: '/descubrir', params: id ? { cat: String(id) } : {} });
  };

  return (
    <Screen>
      {/* Portada */}
      <View style={{ minHeight: 232, justifyContent: 'center' }}>
        <View style={{ maxWidth: '54%', gap: space[3] }}>
          <Text style={[typography.hero, { color: colors.text }]} accessibilityRole="header" accessibilityLabel={`Descubre ${city}`}>
            Descubre {city}
            <Text aria-hidden style={{ color: colors.mark }}>
              _
            </Text>
          </Text>
          <P muted style={{ fontSize: 14, lineHeight: 20 }}>
            Cafés, librerías, restaurantes, planes culturales y rincones con encanto.
          </P>
        </View>
        <View style={{ position: 'absolute', right: -4, bottom: 0, top: 0, justifyContent: 'center', width: '44%', alignItems: 'flex-end' }}>
          <RuvakIllustration pose="gato-perfil" height={190} />
        </View>
      </View>

      <SearchField value={q} onChangeText={setQ} onSubmit={search} placeholder="Busca lugares, planes o ideas…" label="Buscar lugares, planes o ideas" />

      <Row gap={6}>
        {SHORTCUTS.map((s) => (
          <CategoryShortcut key={s.slug} label={s.label} icon={s.icon} onPress={() => goCategory(s.slug)} />
        ))}
      </Row>

      <View style={{ gap: space[3] }}>
        <SectionHeader title="Próximas aperturas y eventos" action={{ label: 'Ver todo', onPress: () => router.navigate('/descubrir') }} />
        {discovery.error ? <ErrorState message={discovery.error} onRetry={discovery.reload} /> : null}
        {discovery.loading && !discovery.data ? <SkeletonList rows={1} /> : null}
        {discovery.data && !upcoming.length ? <P muted>Aún no hay aperturas ni eventos publicados para {city}.</P> : null}
        {upcoming.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3], paddingRight: space[4] }}>
            {upcoming.map((i) => (
              <RecommendedCard
                key={i.id}
                item={i}
                categoryName={categoryName(i.place?.categoryId ?? null)}
                onPress={() => (i.placeId != null ? router.push(`/lugar/${i.placeId}`) : router.navigate('/descubrir'))}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={{ gap: space[3] }}>
        <SectionHeader title="Por visitar" action={{ label: 'Ver todos', onPress: () => router.navigate('/lugares') }} />
        {toVisit.slice(0, 5).map((p) => (
          <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />
        ))}
        {places.data && !toVisit.length ? <P muted>No tienes lugares pendientes. Añade uno con el «+».</P> : null}
      </View>

      {places.error ? <ErrorState message={places.error} onRetry={places.reload} /> : null}
      {places.loading && !places.data ? <SkeletonList rows={2} /> : null}
      {places.data && all.length === 0 ? (
        <RuvakEmptyState
          pose="gato-sorprendido"
          title="Tu mapa está vacío"
          text="Pega el enlace de un sitio que viste en TikTok, Instagram o Google Maps, o importa tus guardados."
          action={{ label: 'Guardar mi primer lugar', onPress: () => router.push('/lugar/nuevo') }}
        />
      ) : null}
    </Screen>
  );
}
