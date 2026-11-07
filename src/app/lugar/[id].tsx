import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconButton, type IconName } from '@/components/Icon';
import { SourceLine } from '@/components/Place';
import { Badge, Button, Card, Chip, confirmAction, ErrorState, Field, H1, H2, InlineNotice, Loading, Overline, P, Row, Screen } from '@/components/ui';
import { createCollection, getCollections, getPlace, savePlace, setPlaceArchived, setPlaceCollections, unsavePlace, updateUserPlace } from '@/lib/data';
import { formatDate, hostOf, mapsUrl, openExternal } from '@/lib/format';
import { useCategoryName, useSession } from '@/lib/session';
import { colors, iconSize, radii, space, states, touchTarget, typography } from '@/lib/tokens';
import { SOURCE_TYPE_LABELS, VISIT_STATUS_LABELS, type VisitStatus } from '@/lib/types';
import { useLoad } from '@/lib/useLoad';

const STATUSES: { key: VisitStatus | null; label: string; icon: IconName }[] = [
  { key: 'pending', label: VISIT_STATUS_LABELS.pending, icon: 'pending' },
  { key: 'visited', label: VISIT_STATUS_LABELS.visited, icon: 'check-circle' },
  { key: 'discarded', label: VISIT_STATUS_LABELS.discarded, icon: 'ban' },
  { key: null, label: 'Sin estado', icon: 'x' },
];

/** Ficha de lugar (RF-08): datos que existan, acciones personales, fuente y fecha. Nada inventado. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);
  const { profile, bump } = useSession();
  const categoryName = useCategoryName();
  const detail = useLoad(() => getPlace(placeId), [placeId]);
  const lists = useLoad(getCollections, []);
  const [newList, setNewList] = useState('');
  const [error, setError] = useState<string | null>(null);

  const d = detail.data;

  if (detail.error)
    return (
      <Screen>
        <ErrorState message={detail.error} onRetry={detail.reload} />
      </Screen>
    );
  if (!d)
    return detail.loading ? (
      <Loading />
    ) : (
      <Screen>
        <InlineNotice tone="warning">No encontramos este lugar o no tienes acceso.</InlineNotice>
      </Screen>
    );

  const { place, me } = d;
  const saved = !!me;
  const canEdit = place.isEditorial ? profile?.role === 'admin' : true;
  const cat = categoryName(place.categoryId);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      detail.reload();
      bump();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const toggleList = (listId: number) => {
    const next = d.collectionIds.includes(listId) ? d.collectionIds.filter((x) => x !== listId) : [...d.collectionIds, listId];
    act(() => setPlaceCollections(place.id, next));
  };
  const addList = () => {
    const n = newList.trim();
    if (!n) return;
    act(async () => {
      const lid = await createCollection(n);
      await setPlaceCollections(place.id, [...d.collectionIds, lid]);
      setNewList('');
      lists.reload();
    });
  };
  const remove = () =>
    confirmAction(
      place.isEditorial ? '¿Quitar de tu colección?' : '¿Borrar este lugar?',
      place.isEditorial
        ? 'Se quitan tu estado, tu nota y tus listas. La ficha de RUVAK sigue existiendo.'
        : 'Es una ficha tuya: se borra con su nota, fuentes y listas.',
      place.isEditorial ? 'Quitar' : 'Borrar',
      () =>
        act(async () => {
          await unsavePlace(place.id, !place.isEditorial);
          router.back();
        }),
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: place.name }} />
      {/* Imagen principal solo si existe una foto real con permiso; si no, bloque tipográfico. */}
      {place.imageUrl ? (
        <View style={{ gap: space[1] }}>
          <Image source={{ uri: place.imageUrl }} style={styles.hero} contentFit="cover" accessibilityLabel={`Foto de ${place.name}`} transition={0} />
          {place.imageCredit ? <Text style={[typography.caption, { color: colors.textSecondary }]}>Foto: {place.imageCredit}</Text> : null}
        </View>
      ) : null}

      <View style={{ gap: space[2] }}>
        <Overline color={colors.lime}>{[cat, place.zone].filter(Boolean).join(' · ') || 'Lugar'}</Overline>
        <Row gap={space[2]} style={{ alignItems: 'flex-start' }}>
          <H1 style={{ flex: 1 }}>{place.name}</H1>
          <IconButton
            name="heart"
            label={me?.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            pressed={!!me?.favorite}
            color={me?.favorite ? colors.newsText : colors.text}
            fill={me?.favorite ? colors.newsText : undefined}
            onPress={() => act(() => updateUserPlace(place.id, { favorite: !me?.favorite }))}
          />
        </Row>
        {place.address ? <P muted>{place.address}</P> : null}
        <Row gap={space[1]} wrap>
          {place.isEditorial ? <Badge label="Ficha de RUVAK" tone="blue" icon="check" /> : <Badge label="Ficha privada" icon="shield" />}
          {place.lat == null ? <Badge label="Sin ubicación" icon="alert" /> : null}
          {place.archived ? <Badge label="Archivado" icon="archive" /> : null}
        </Row>
      </View>

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

      <Row gap={space[2]} wrap>
        {!saved ? <Button title="Guardar en mis lugares" icon="bookmark" onPress={() => act(() => savePlace(place.id))} /> : null}
        <Button
          title="Abrir en Google Maps"
          icon="navigation"
          variant="secondary"
          onPress={() => openExternal(mapsUrl(place))}
          accessibilityHint="Para cómo llegar, horarios y reseñas"
        />
        {canEdit ? <Button title="Editar" icon="pencil" variant="secondary" onPress={() => router.push(`/lugar/editar/${place.id}`)} /> : null}
      </Row>

      <Card>
        <H2>Tu estado</H2>
        <View style={styles.statusRow} accessibilityRole="radiogroup" accessibilityLabel="Estado de visita">
          {STATUSES.map((s) => {
            const sel = (me?.status ?? null) === s.key && (saved || s.key !== null);
            return (
              <Pressable
                key={String(s.key)}
                onPress={() => act(() => updateUserPlace(place.id, { status: s.key }))}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel }}
                style={({ pressed }) => [styles.statusBtn, sel && styles.statusSel, { opacity: pressed ? states.pressedOpacity : 1 }]}
              >
                <Icon name={sel ? 'check' : s.icon} color={sel ? colors.onPrimary : colors.text} size={iconSize.sm} />
                <Text style={[typography.label, { color: sel ? colors.onPrimary : colors.text }]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {me?.visitedAt ? <P muted style={{ fontSize: 14 }}>{`Visitado el ${formatDate(me.visitedAt)}`}</P> : null}
        {me ? <P muted style={{ fontSize: 13 }}>{`Guardado el ${formatDate(me.savedAt)}`}</P> : null}
      </Card>

      <Card>
        <H2>Listas</H2>
        <Row wrap>
          {(lists.data ?? []).map((l) => (
            <Chip key={l.id} label={l.name} selected={d.collectionIds.includes(l.id)} onPress={() => toggleList(l.id)} />
          ))}
        </Row>
        {lists.data && !lists.data.length ? (
          <P muted style={{ fontSize: 14 }}>
            Todavía no tienes listas propias.
          </P>
        ) : null}
        <Row gap={space[2]} style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field label="Nueva lista" placeholder="Ej.: Para ir con amigos" value={newList} onChangeText={setNewList} onSubmitEditing={addList} />
          </View>
          <Button title="Crear" variant="secondary" onPress={addList} />
        </Row>
      </Card>

      {/* Nota privada, separada visualmente de la descripción editorial (§11 Ficha). key: se reinicia al cambiar lo guardado. */}
      <NoteCard
        key={`${place.id}:${me?.note ?? ''}:${(me?.tags ?? []).join(',')}`}
        initialNote={me?.note ?? ''}
        initialTags={(me?.tags ?? []).join(', ')}
        onSave={(note, tags) => act(() => updateUserPlace(place.id, { note, tags }))}
      />

      <Card>
        <H2>Información práctica</H2>
        {place.description ? <P>{place.description}</P> : null}
        <InfoRow icon="pin" label="Dirección" value={place.address} />
        <InfoRow icon="phone" label="Teléfono" value={place.phone} onPress={place.phone ? () => openExternal(`tel:${place.phone}`) : undefined} />
        <InfoRow
          icon="globe"
          label="Web"
          value={place.website ? hostOf(place.website) : null}
          onPress={place.website ? () => openExternal(place.website!) : undefined}
        />
        {/* Sin datos autorizados de horarios ni reseñas: se enlaza, no se inventa (§8). */}
        <InlineNotice>Horarios y reseñas pueden cambiar: consúltalos en Google Maps antes de ir.</InlineNotice>
        <P muted style={{ fontSize: 13 }}>{`Ficha actualizada el ${formatDate(place.updatedAt)}`}</P>
      </Card>

      <Card>
        <H2>Fuentes</H2>
        {d.sources.length ? (
          d.sources.map((s) => (
            <View key={s.id} style={styles.source}>
              <Row gap={space[1]}>
                <Badge label={SOURCE_TYPE_LABELS[s.sourceType]} />
                {s.mine ? <Badge label="Solo tú" icon="shield" /> : null}
              </Row>
              <SourceLine name={s.label} url={s.url} date={s.checkedAt ?? s.createdAt} dateLabel={s.checkedAt ? 'Verificado' : 'Añadido'} />
            </View>
          ))
        ) : (
          <P muted>Sin fuente registrada.</P>
        )}
      </Card>

      <Row gap={space[2]} wrap>
        {!place.isEditorial ? (
          <Button
            title={place.archived ? 'Desarchivar' : 'Archivar'}
            icon="archive"
            variant="secondary"
            onPress={() => act(() => setPlaceArchived(place.id, !place.archived))}
            accessibilityHint="Lo oculta de la colección sin borrarlo"
          />
        ) : null}
        {saved ? <Button title={place.isEditorial ? 'Quitar de mi colección' : 'Borrar lugar'} icon="trash" variant="danger" onPress={remove} /> : null}
      </Row>
    </Screen>
  );
}

function NoteCard({ initialNote, initialTags, onSave }: { initialNote: string; initialTags: string; onSave: (note: string, tags: string[]) => Promise<void> }) {
  const [note, setNote] = useState(initialNote);
  const [tags, setTags] = useState(initialTags);
  const dirty = note !== initialNote || tags !== initialTags;
  return (
    <Card style={{ borderColor: colors.outline }}>
      <Row gap={space[2]}>
        <Icon name="shield" color={colors.lime} size={iconSize.md} />
        <H2>Tu nota privada</H2>
      </Row>
      <P muted style={{ fontSize: 14 }}>
        Solo la ves tú. Apunta por qué lo guardaste o qué quieres probar.
      </P>
      <Field label="Nota" multiline value={note} onChangeText={setNote} placeholder="Ej.: Me lo recomendó Lucía; probar la tarta de queso." />
      <Field label="Etiquetas" optional hint="Separadas por comas." value={tags} onChangeText={setTags} placeholder="terraza, para trabajar" />
      <Row gap={space[2]}>
        <Button
          title="Guardar nota"
          variant="secondary"
          disabled={!dirty}
          onPress={() =>
            onSave(
              note,
              tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
        />
        {!dirty && initialNote ? <Badge label="Guardada" icon="check" tone="blue" /> : null}
      </Row>
    </Card>
  );
}

function InfoRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string | null; onPress?: () => void }) {
  if (!value) return null;
  const content = (
    <Row gap={space[3]} style={{ minHeight: touchTarget }}>
      <Icon name={icon} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[typography.body, { color: onPress ? colors.blueText : colors.text }]}>{value}</Text>
      </View>
      {onPress ? <Icon name="external" color={colors.blueText} size={iconSize.sm} /> : null}
    </Row>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${label}: ${value}`}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.md, backgroundColor: colors.surface0 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    minHeight: touchTarget,
    paddingHorizontal: space[3],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.raised,
  },
  statusSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  source: { gap: space[1], paddingVertical: space[2], borderTopWidth: 1, borderTopColor: colors.border },
});
