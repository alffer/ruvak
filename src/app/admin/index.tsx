import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { KindBadge, VerificationBadge } from '@/components/Place';
import { Badge, Button, Card, ErrorState, H2, InlineNotice, P, Row, Screen, SkeletonList } from '@/components/ui';
import { getDiscovery, getEditorialPlaces } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/** Panel editorial mínimo (RF-14). La seguridad real está en RLS: un no-admin no puede escribir. */
export default function Admin() {
  const { profile, activeCity } = useSession();
  const items = useLoad(() => (activeCity ? getDiscovery(activeCity.id, { includeDrafts: true, includeHidden: true }) : Promise.resolve([])), [activeCity?.id]);
  const places = useLoad(getEditorialPlaces, []);

  if (profile?.role !== 'admin')
    return (
      <Screen>
        <InlineNotice tone="warning">Esta sección es solo para el equipo editorial.</InlineNotice>
      </Screen>
    );

  return (
    <Screen>
      <Row gap={space[2]} wrap>
        <Button title="Nuevo contenido" icon="plus" onPress={() => router.push('/admin/contenido')} />
        <Button title="Nueva ficha editorial" icon="pin" variant="secondary" onPress={() => router.push('/lugar/nuevo')} />
      </Row>
      <P muted style={{ fontSize: 14 }}>
        Antes de publicar: fuente, fecha de revisión y estado de verificación. Si un dato puede haber cambiado, márcalo como «Información antigua» o retíralo.
      </P>

      <View style={{ gap: space[3] }}>
        <H2>{`Descubrir · ${activeCity?.name ?? ''}`}</H2>
        {items.error ? <ErrorState message={items.error} onRetry={items.reload} /> : null}
        {items.loading && !items.data ? <SkeletonList rows={3} /> : null}
        {(items.data ?? []).map((i) => (
          <Card key={i.id} onPress={() => router.push(`/admin/contenido?id=${i.id}`)} accessibilityLabel={`Editar ${i.title}`}>
            <Row gap={space[1]} wrap>
              <KindBadge kind={i.kind} />
              <VerificationBadge v={i.verification} />
              {i.published ? <Badge label="Publicado" tone="blue" icon="check" /> : <Badge label="Borrador" icon="pencil" />}
            </Row>
            <Text style={[typography.cardTitle, { color: colors.text }]}>{i.title}</Text>
            <P muted style={{ fontSize: 13 }}>
              {[i.sourceName ? `Fuente: ${i.sourceName}` : 'Sin fuente', i.verifiedAt ? `revisado ${formatDate(i.verifiedAt)}` : 'sin fecha de revisión'].join(
                ' · ',
              )}
            </P>
          </Card>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        <H2>Fichas editoriales</H2>
        {(places.data ?? []).map((p) => (
          <Card key={p.id} onPress={() => router.push(`/lugar/${p.id}`)} accessibilityLabel={p.name}>
            <Row gap={space[2]}>
              <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>{p.name}</Text>
              {p.lat == null ? <Badge label="Sin ubicación" icon="alert" /> : null}
              {p.archived ? <Badge label="Retirada" icon="archive" /> : null}
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
