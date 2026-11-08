import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Text, View } from 'react-native';
import { Button, Card, Chip, confirmAction, Field, H2, InlineNotice, Loading, P, Row, Screen, ToggleRow } from '@/components/ui';
import { deleteDiscovery, getDiscovery, getEditorialPlaces, saveDiscovery, uploadDiscoveryImage, type DiscoveryInput } from '@/lib/data';
import { nameKey } from '@/lib/dedupe';
import { useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { DISCOVERY_KIND_LABELS, VERIFICATION_LABELS, type DiscoveryKind, type Verification } from '@/lib/types';
import { coerceUrl } from '@/lib/urlParse';
import { useLoad } from '@/lib/useLoad';

const today = () => new Date().toISOString().slice(0, 10);

/** Alta y edición de contenido de Descubrir (RF-14). */
export default function EditContent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const itemId = id ? Number(id) : null;
  const { activeCity, profile } = useSession();
  const existing = useLoad(
    () => (itemId && activeCity ? getDiscovery(activeCity.id, { includeDrafts: true, includeHidden: true }) : Promise.resolve([])),
    [itemId, activeCity?.id],
  );

  if (profile?.role !== 'admin')
    return (
      <Screen>
        <InlineNotice tone="warning">Solo para el equipo editorial.</InlineNotice>
      </Screen>
    );
  if (!activeCity || (itemId && !existing.data)) return <Loading />;
  const it = itemId ? existing.data?.find((x) => x.id === itemId) : null;
  if (itemId && !it)
    return (
      <Screen>
        <InlineNotice tone="warning">Este contenido ya no existe.</InlineNotice>
      </Screen>
    );
  const initial: DiscoveryInput = it
    ? {
        cityId: it.cityId,
        placeId: it.placeId,
        kind: it.kind,
        title: it.title,
        summary: it.summary,
        imageUrl: it.imageUrl,
        imageCredit: it.imageCredit,
        verification: it.verification,
        sourceName: it.sourceName,
        sourceUrl: it.sourceUrl,
        verifiedAt: it.verifiedAt,
        startsOn: it.startsOn,
        endsOn: it.endsOn,
        published: it.published,
      }
    : {
        cityId: activeCity.id,
        placeId: null,
        kind: 'recommended',
        title: '',
        summary: '',
        imageUrl: null,
        imageCredit: null,
        verification: 'unverified',
        sourceName: null,
        sourceUrl: null,
        verifiedAt: today(),
        published: false,
      };
  // key: el formulario arranca con los datos cargados (sin copiar estado en un efecto).
  return <ContentForm key={itemId ?? 'new'} itemId={itemId} initial={initial} />;
}

function ContentForm({ itemId, initial }: { itemId: number | null; initial: DiscoveryInput }) {
  const { bump } = useSession();
  const places = useLoad(getEditorialPlaces, []);
  const [d, setD] = useState<DiscoveryInput>(initial);
  const [placeQuery, setPlaceQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<DiscoveryInput>) => setD({ ...d, ...patch });
  const matches = (places.data ?? []).filter((p) => !placeQuery || nameKey(p.name).includes(nameKey(placeQuery))).slice(0, 8);
  const linked = places.data?.find((p) => p.id === d.placeId);

  async function save() {
    if (!d.title.trim()) return setError('El título es obligatorio.');
    if (d.sourceUrl && !coerceUrl(d.sourceUrl)) return setError('La URL de la fuente no es válida.');
    if (d.imageUrl && !d.imageCredit?.trim()) return setError('Indica el crédito o la licencia de la foto.');
    if (d.published && !d.sourceName?.trim() && !d.sourceUrl?.trim()) return setError('Para publicar, indica la fuente.');
    if (d.published && (d.kind === 'just_opened' || d.kind === 'upcoming_opening') && d.verification !== 'confirmed' && d.verification !== 'announced')
      return setError('Una apertura publicada debe estar «Confirmada» o «Anunciada». Si no está comprobada, guárdala como borrador.');
    setBusy(true);
    setError(null);
    try {
      await saveDiscovery(itemId, { ...d, sourceUrl: d.sourceUrl ? coerceUrl(d.sourceUrl)!.href : null });
      bump();
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ maxWidth: 760 }}>
      <Card>
        <H2>Contenido</H2>
        <Text style={[typography.label, { color: colors.text }]}>Tipo</Text>
        <Row wrap>
          {(Object.keys(DISCOVERY_KIND_LABELS) as DiscoveryKind[]).map((k) => (
            <Chip key={k} label={DISCOVERY_KIND_LABELS[k]} selected={d.kind === k} onPress={() => set({ kind: k })} />
          ))}
        </Row>
        <Field label="Título" value={d.title} onChangeText={(title) => set({ title })} />
        <Field
          label="Resumen"
          multiline
          value={d.summary}
          onChangeText={(summary) => set({ summary })}
          hint="Breve. No afirmes que RUVAK lo ha visitado o probado."
        />
      </Card>

      <Card>
        <H2>Lugar</H2>
        {linked ? (
          <Row gap={space[2]}>
            <P style={{ flex: 1 }}>{linked.name}</P>
            <Button title="Quitar" variant="ghost" onPress={() => set({ placeId: null })} />
          </Row>
        ) : (
          <>
            <Field label="Buscar ficha editorial" value={placeQuery} onChangeText={setPlaceQuery} />
            <Row wrap>
              {matches.map((p) => (
                <Chip key={p.id} label={p.name} selected={false} onPress={() => set({ placeId: p.id })} />
              ))}
            </Row>
            <P muted style={{ fontSize: 14 }}>
              Si no existe, créala antes en «Nueva ficha editorial».
            </P>
          </>
        )}
      </Card>

      <Card>
        <H2>Verificación y fuente</H2>
        <Row wrap>
          {(Object.keys(VERIFICATION_LABELS) as Verification[]).map((v) => (
            <Chip key={v} label={VERIFICATION_LABELS[v]} selected={d.verification === v} onPress={() => set({ verification: v })} />
          ))}
        </Row>
        <Field
          label="Nombre de la fuente"
          value={d.sourceName ?? ''}
          onChangeText={(sourceName) => set({ sourceName })}
          placeholder="Ej.: Ayuntamiento de Gijón"
        />
        <Field
          label="URL de la fuente"
          optional
          value={d.sourceUrl ?? ''}
          onChangeText={(sourceUrl) => set({ sourceUrl })}
          autoCapitalize="none"
          keyboardType="url"
        />
        {d.kind === 'plan' ? (
          <>
            <Field
              label="Empieza"
              hint="AAAA-MM-DD. Un evento sin fecha de fin no se muestra."
              value={d.startsOn ?? ''}
              onChangeText={(startsOn) => set({ startsOn })}
            />
            <Field
              label="Termina"
              hint="AAAA-MM-DD. Cuando pasa, el evento desaparece solo."
              value={d.endsOn ?? ''}
              onChangeText={(endsOn) => set({ endsOn })}
            />
          </>
        ) : null}
        <Field label="Fecha de revisión" hint="AAAA-MM-DD" value={d.verifiedAt ?? ''} onChangeText={(verifiedAt) => set({ verifiedAt })} />
        <Row gap={space[2]} wrap>
          <Button
            title="Subir foto"
            icon="upload"
            variant="secondary"
            onPress={async () => {
              const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
              if (res.canceled || !res.assets[0]) return;
              try {
                const url = await uploadDiscoveryImage(res.assets[0].uri, res.assets[0].mimeType);
                set({ imageUrl: url });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          {d.imageUrl ? <Button title="Quitar foto" variant="ghost" onPress={() => set({ imageUrl: null, imageCredit: null })} /> : null}
        </Row>
        <Field
          label="Foto (URL)"
          optional
          value={d.imageUrl ?? ''}
          onChangeText={(imageUrl) => set({ imageUrl })}
          autoCapitalize="none"
          hint="Solo fotos reales del lugar con permiso de uso."
        />
        {d.imageUrl ? <Field label="Crédito / licencia de la foto" value={d.imageCredit ?? ''} onChangeText={(imageCredit) => set({ imageCredit })} /> : null}
      </Card>

      <ToggleRow label="Publicado" hint="Visible para todos en Descubrir." value={d.published} onChange={(published) => set({ published })} />
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <View style={{ gap: space[2] }}>
        <Button title="Guardar" onPress={save} loading={busy} />
        {itemId ? (
          <Row gap={space[2]} wrap>
            <Button
              title="Marcar como antigua y retirar"
              variant="secondary"
              icon="archive"
              onPress={() => setD({ ...d, verification: 'outdated', published: false })}
            />
            <Button
              title="Borrar"
              variant="danger"
              icon="trash"
              onPress={() =>
                confirmAction('¿Borrar este contenido?', 'No se puede deshacer. Si solo está desactualizado, mejor retíralo.', 'Borrar', async () => {
                  await deleteDiscovery(itemId);
                  bump();
                  router.back();
                })
              }
            />
          </Row>
        ) : null}
      </View>
    </Screen>
  );
}
