import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { KindBadge, VerificationBadge } from '@/components/Place';
import { Badge, Button, Card, ErrorState, H2, InlineNotice, P, Row, Screen, SkeletonList } from '@/components/ui';
import { confirmDiscoveryOpened, deleteDiscovery, getDiscovery, getEditorialPlaces, setDiscoveryPublished } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/** Panel editorial mínimo (RF-14). La seguridad real está en RLS: un no-admin no puede escribir. */
export default function Admin() {
  const { profile, activeCity } = useSession();
  const items = useLoad(() => (activeCity ? getDiscovery(activeCity.id, { includeDrafts: true, includeHidden: true }) : Promise.resolve([])), [activeCity?.id]);
  const places = useLoad(getEditorialPlaces, []);
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const drafts = (items.data ?? []).filter((i) => !i.published && i.sourceUrl);

  async function act(id: number, fn: () => Promise<void>, ok: string) {
    setBusy(id);
    setNote(null);
    try {
      await fn();
      setNote(ok);
      items.reload();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

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

      {/* Borradores que trae el proceso diario de novedades: nada se publica sin tu decisión. */}
      <View style={{ gap: space[3] }}>
        <H2>{`Pendientes de revisar (${drafts.length})`}</H2>
        {note ? <InlineNotice tone="info">{note}</InlineNotice> : null}
        {items.data && !drafts.length ? <P muted>No hay novedades pendientes.</P> : null}
        {drafts.map((i) => (
          <Card key={i.id}>
            <Row gap={space[1]} wrap>
              <KindBadge kind={i.kind} />
              <VerificationBadge v={i.verification} />
            </Row>
            <Text style={[typography.cardTitle, { color: colors.text }]}>{i.title}</Text>
            {i.summary ? (
              <P muted style={{ fontSize: 14 }}>
                {i.summary}
              </P>
            ) : null}
            <P muted style={{ fontSize: 14 }}>{`Fuente: ${i.sourceName ?? 'sin indicar'}`}</P>
            <Row gap={space[2]} wrap>
              {i.kind === 'upcoming_opening' || i.kind === 'announced' ? (
                <Button
                  title="Ya está abierto"
                  icon="sparkles"
                  variant="secondary"
                  loading={busy === i.id}
                  onPress={() => act(i.id, () => confirmDiscoveryOpened(i.id), `«${i.title}» confirmada como abierta.`)}
                />
              ) : null}
              <Button
                title="Publicar"
                icon="check"
                loading={busy === i.id}
                onPress={() => act(i.id, () => setDiscoveryPublished(i.id, true), `«${i.title}» publicada.`)}
              />
              <Button title="Abrir fuente" icon="external" variant="secondary" onPress={() => Linking.openURL(i.sourceUrl!)} />
              <Button title="Descartar" icon="trash" variant="danger" onPress={() => act(i.id, () => deleteDiscovery(i.id), `«${i.title}» descartada.`)} />
            </Row>
          </Card>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        <H2>{`Descubrir · ${activeCity?.name ?? ''}`}</H2>
        {items.error ? <ErrorState message={items.error} onRetry={items.reload} /> : null}
        {items.loading && !items.data ? <SkeletonList rows={3} /> : null}
        {(items.data ?? []).map((i) => (
          <Card key={i.id} onPress={() => router.push(`/admin/contenido?id=${i.id}`)} accessibilityLabel={`Editar ${i.title}`}>
            <Row gap={space[1]} wrap>
              <KindBadge kind={i.kind} />
              <VerificationBadge v={i.verification} />
              {/* Solo se señala lo que NO está publicado (lo normal no necesita etiqueta). */}
              {i.published ? null : <Badge label="Borrador" icon="pencil" />}
            </Row>
            <Text style={[typography.cardTitle, { color: colors.text }]}>{i.title}</Text>
            <P muted style={{ fontSize: 14 }}>
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
