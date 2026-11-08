import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KindBadge, VerificationBadge } from '@/components/Place';
import { Badge, Button, Card, confirmAction, ErrorState, H1, H2, InlineNotice, LinkButton, P, Row, Screen, SkeletonList } from '@/components/ui';
import { confirmDiscoveryOpened, deleteDiscovery, getDiscovery, getEditorialPlaces, setDiscoveryPublished } from '@/lib/data';
import { formatDate, openExternal } from '@/lib/format';
import { setPendingCount } from '@/lib/pendientes';
import { useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/**
 * Pestaña «Revisar» (solo administradoras): novedades que trae el proceso diario, pendientes de decisión.
 * Nada llega publicado sin pasar por aquí. La seguridad real está en RLS: un no-admin no puede escribir.
 */
export default function Revisar() {
  const { profile, activeCity } = useSession();
  const items = useLoad(() => (activeCity ? getDiscovery(activeCity.id, { includeDrafts: true, includeHidden: true }) : Promise.resolve([])), [activeCity?.id]);
  const places = useLoad(getEditorialPlaces, []);
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  // Pendientes = borradores con fuente (sin fuente no se publica desde aquí). Los demás se cuentan aparte.
  const drafts = (items.data ?? []).filter((i) => !i.published && i.sourceUrl);
  const draftsWithoutSource = (items.data ?? []).filter((i) => !i.published && !i.sourceUrl).length;

  // La insignia de la pestaña se actualiza con cada carga (publicar o descartar la recalcula).
  useEffect(() => {
    if (items.data) setPendingCount(items.data.filter((i) => !i.published && i.sourceUrl).length);
    else if (items.error) setPendingCount(null);
  }, [items.data, items.error]);

  async function act(id: number, fn: () => Promise<void>, ok: string) {
    setBusy(id);
    setNote(null);
    try {
      await fn();
      setNote({ tone: 'info', text: ok });
      items.reload();
    } catch {
      // El mensaje técnico (puede venir en inglés) no se muestra; la usuaria puede volver a intentarlo.
      setNote({ tone: 'error', text: 'No se pudo completar la acción. Inténtalo de nuevo.' });
    } finally {
      setBusy(null);
    }
  }

  function discard(id: number, title: string) {
    confirmAction('¿Descartar esta novedad?', `«${title}» se borra de la base de datos y no se puede deshacer.`, 'Descartar', () =>
      act(id, () => deleteDiscovery(id), `«${title}» descartada.`),
    );
  }

  if (profile?.role !== 'admin')
    return (
      <Screen>
        <InlineNotice tone="warning">Esta sección es solo para el equipo editorial.</InlineNotice>
      </Screen>
    );

  return (
    <Screen>
      <H1>Revisar</H1>

      {/* Borradores que trae el proceso diario de novedades: nada se publica sin tu decisión. */}
      <View style={{ gap: space[3] }}>
        <H2>{items.data ? `Pendientes de revisar (${drafts.length})` : 'Pendientes de revisar'}</H2>
        <P muted style={{ fontSize: 14 }}>
          Antes de publicar: fuente, fecha de revisión y estado de verificación. Si un dato puede haber cambiado, márcalo como «Información antigua» o retíralo.
        </P>
        {note ? <InlineNotice tone={note.tone}>{note.text}</InlineNotice> : null}
        {items.error ? <ErrorState message="No se pudieron cargar las novedades." onRetry={items.reload} /> : null}
        {items.loading && !items.data ? <SkeletonList rows={2} /> : null}
        {items.data && !drafts.length && !items.error ? <P muted>No hay novedades pendientes.</P> : null}
        {draftsWithoutSource > 0 ? (
          <P muted style={{ fontSize: 14 }}>
            {`${draftsWithoutSource} borrador${draftsWithoutSource === 1 ? '' : 'es'} sin fuente: no se publican desde aquí. Revísalos en «Contenido».`}
          </P>
        ) : null}
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
              <Button
                title="Publicar"
                icon="check"
                loading={busy === i.id}
                onPress={() => act(i.id, () => setDiscoveryPublished(i.id, true), `«${i.title}» publicada.`)}
              />
              {i.kind === 'upcoming_opening' || i.kind === 'announced' ? (
                <Button
                  title="Ya está abierto"
                  icon="sparkles"
                  variant="secondary"
                  disabled={busy !== null}
                  onPress={() => act(i.id, () => confirmDiscoveryOpened(i.id), `«${i.title}» confirmada como abierta.`)}
                />
              ) : null}
              <LinkButton label="Abrir fuente" onPress={() => openExternal(i.sourceUrl!)} />
              <Button title="Descartar" icon="trash" variant="danger" disabled={busy !== null} onPress={() => discard(i.id, i.title)} />
            </Row>
          </Card>
        ))}
      </View>

      <View style={{ gap: space[3] }}>
        <H2>{`Descubrir · ${activeCity?.name ?? ''}`}</H2>
        {(items.data ?? []).map((i) => (
          <Card key={i.id} onPress={() => router.push(`/admin/contenido?id=${i.id}`)} accessibilityLabel={`Abrir ${i.title} para editar`}>
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

      <Row gap={space[2]} wrap>
        <Button title="Nuevo contenido" icon="plus" variant="secondary" onPress={() => router.push('/admin/contenido')} />
        <Button title="Nueva ficha editorial" icon="pin" variant="secondary" onPress={() => router.push('/lugar/nuevo')} />
      </Row>
    </Screen>
  );
}
