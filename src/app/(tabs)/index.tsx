import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { KindBadge, PlaceListItem } from '@/components/Place';
import { RuvakAvatar, RuvakEmptyState } from '@/components/Ruvak';
import { Button, Card, ErrorState, Overline, P, Row, Screen, SectionHeader, SkeletonList } from '@/components/ui';
import { getDiscovery, getMyPlaces } from '@/lib/data';
import { plural } from '@/lib/format';
import { rankDiscovery } from '@/lib/recommend';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, iconSize, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/** Inicio: resumen personal, pendientes, favoritos y novedades de la ciudad activa (§11). */
export default function Home() {
  const { profile, activeCity, interests } = useSession();
  const categoryName = useCategoryName();
  const places = useLoad(getMyPlaces, []);
  const discovery = useLoad(() => (activeCity ? getDiscovery(activeCity.id) : Promise.resolve([])), [activeCity?.id]);

  const all = (places.data ?? []).filter((p) => !p.archived);
  const pending = all.filter((p) => p.me.status === 'pending');
  const favorites = all.filter((p) => p.me.favorite);
  const news = rankDiscovery(discovery.data ?? [], {
    personalizationEnabled: !!profile?.personalizationEnabled,
    interestIds: interests,
    categoryName,
    saved: all,
  }).slice(0, 3);

  return (
    <Screen>
      <Row gap={space[3]} style={{ alignItems: 'flex-start' }}>
        <RuvakAvatar size={52} />
        <View style={{ flex: 1, gap: space[1] }}>
          <Overline color={colors.lime}>{activeCity?.name ?? 'Tu ciudad'}</Overline>
          <Text style={[typography.title, { color: colors.text }]} accessibilityRole="header">
            {profile?.displayName ? `Hola, ${profile.displayName}.` : 'Hola.'} {pending.length ? 'Tu próxima parada te espera.' : 'Un rincón nuevo en tu mapa.'}
          </Text>
          {places.data ? (
            <P muted>
              {plural(all.length, 'lugar guardado', 'lugares guardados')} · {plural(pending.length, 'pendiente', 'pendientes')}
            </P>
          ) : null}
        </View>
      </Row>

      <Row gap={space[2]} wrap>
        <Button title="Añadir lugar" icon="plus" onPress={() => router.push('/lugar/nuevo')} />
        <Button title="Importar de Google" icon="upload" variant="secondary" onPress={() => router.push('/importar')} />
      </Row>

      {places.error ? <ErrorState message={places.error} onRetry={places.reload} /> : null}
      {places.loading && !places.data ? <SkeletonList rows={3} /> : null}

      {places.data && all.length === 0 ? (
        <RuvakEmptyState
          title="Tu mapa está vacío"
          text="Pega el enlace de un sitio que viste en TikTok, Instagram o Google Maps, o importa tus guardados."
          action={{ label: 'Guardar mi primer lugar', onPress: () => router.push('/lugar/nuevo') }}
        />
      ) : null}

      {pending.length ? (
        <View style={{ gap: space[3] }}>
          <SectionHeader title="Pendientes" action={{ label: 'Ver todos', onPress: () => router.push('/lista/pending') }} />
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
        <SectionHeader
          title={`Novedades en ${activeCity?.name ?? 'tu ciudad'}`}
          action={{ label: 'Descubrir', onPress: () => router.navigate('/descubrir') }}
        />
        {discovery.error ? <ErrorState message={discovery.error} onRetry={discovery.reload} /> : null}
        {discovery.data && !news.length ? <P muted>Aún no hay novedades publicadas para esta ciudad.</P> : null}
        {news.map((i) => (
          <Card key={i.id} onPress={() => router.navigate('/descubrir')} accessibilityLabel={`${i.title}. Abrir Descubrir`}>
            <KindBadge kind={i.kind} />
            <Text style={[typography.cardTitle, { color: colors.text }]}>{i.title}</Text>
            {i.summary ? (
              <P muted numberOfLines={2}>
                {i.summary}
              </P>
            ) : null}
          </Card>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        <SectionHeader title="Planes y viajes" />
        <Row gap={space[3]} wrap>
          <Card onPress={() => router.push('/agenda')} style={{ flexGrow: 1, flexBasis: 220 }} accessibilityLabel="Agenda, próximamente">
            <Icon name="calendar" color={colors.blueText} size={iconSize.lg} />
            <Text style={[typography.cardTitle, { color: colors.text }]}>Agenda</Text>
            <P muted>Eventos y planes por fecha. Próximamente.</P>
          </Card>
          <Card onPress={() => router.push('/viajes')} style={{ flexGrow: 1, flexBasis: 220 }} accessibilityLabel="Viajes, próximamente">
            <Icon name="plane" color={colors.blueText} size={iconSize.lg} />
            <Text style={[typography.cardTitle, { color: colors.text }]}>Viajes</Text>
            <P muted>Prepara otras ciudades. Próximamente.</P>
          </Card>
        </Row>
      </View>
    </Screen>
  );
}
