import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { CategoryShortcut, PlaceListItem, RecommendedCard } from '@/components/Place';
import { RuvakEmptyState, RuvakIllustration } from '@/components/Ruvak';
import { Card, ErrorState, H2, P, Row, Screen, SearchField, SectionHeader, SkeletonList } from '@/components/ui';
import { getDiscovery, getMyPlaces } from '@/lib/data';
import { rankDiscovery } from '@/lib/recommend';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, iconSize, space, typography } from '@/lib/tokens';
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
  const pending = all.filter((p) => p.me.status === 'pending');
  const favorites = all.filter((p) => p.me.favorite);
  const recommended = rankDiscovery(discovery.data ?? [], {
    personalizationEnabled: !!profile?.personalizationEnabled,
    interestIds: interests,
    categoryName,
    saved: all,
  }).slice(0, 8);
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
        <View style={{ maxWidth: '64%', gap: space[3] }}>
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
        <View style={{ position: 'absolute', right: -4, bottom: 0, top: 0, justifyContent: 'center', width: '46%', alignItems: 'flex-end' }}>
          <RuvakIllustration pose="gato-perfil" height={210} />
        </View>
      </View>

      <SearchField value={q} onChangeText={setQ} onSubmit={search} placeholder="Busca lugares, planes o ideas…" label="Buscar lugares, planes o ideas" />

      <Row gap={space[2]}>
        {SHORTCUTS.map((s) => (
          <CategoryShortcut key={s.slug} label={s.label} icon={s.icon} onPress={() => goCategory(s.slug)} />
        ))}
      </Row>

      <View style={{ gap: space[3] }}>
        <SectionHeader title="Recomendados para ti" action={{ label: 'Ver más', onPress: () => router.navigate('/descubrir') }} />
        {discovery.error ? <ErrorState message={discovery.error} onRetry={discovery.reload} /> : null}
        {discovery.loading && !discovery.data ? <SkeletonList rows={1} /> : null}
        {discovery.data && !recommended.length ? <P muted>Aún no hay recomendaciones publicadas para {city}.</P> : null}
        {recommended.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3], paddingRight: space[4] }}>
            {recommended.map((i) => (
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

      {pending.length ? (
        <View style={{ gap: space[3] }}>
          <SectionHeader title="Tu próxima parada" action={{ label: 'Ver todos', onPress: () => router.push('/lista/pending') }} />
          {pending.slice(0, 3).map((p) => (
            <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </View>
      ) : null}

      {favorites.length ? (
        <View style={{ gap: space[3] }}>
          <SectionHeader title="Favoritos" action={{ label: 'Ver todos', onPress: () => router.push('/lista/favorites') }} />
          {favorites.slice(0, 3).map((p) => (
            <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </View>
      ) : null}

      <View style={{ gap: space[3] }}>
        <H2>Planes y viajes</H2>
        <Row gap={space[3]} wrap>
          <Card onPress={() => router.push('/agenda')} style={{ flexGrow: 1, flexBasis: 220 }} accessibilityLabel="Agenda, próximamente">
            <Icon name="calendar" color={colors.accentText} size={iconSize.lg} />
            <Text style={[typography.cardTitle, { color: colors.text }]}>Agenda</Text>
            <P muted>Eventos y planes por fecha. Próximamente.</P>
          </Card>
          <Card onPress={() => router.push('/viajes')} style={{ flexGrow: 1, flexBasis: 220 }} accessibilityLabel="Viajes, próximamente">
            <Icon name="plane" color={colors.accentText} size={iconSize.lg} />
            <Text style={[typography.cardTitle, { color: colors.text }]}>Viajes</Text>
            <P muted>Prepara otras ciudades. Próximamente.</P>
          </Card>
        </Row>
      </View>
    </Screen>
  );
}
