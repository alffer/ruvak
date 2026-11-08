import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { EMPTY_PLACE_FORM, formToInput, PlaceFields, type PlaceFormValue } from '@/components/PlaceForm';
import { Badge, Button, Card, Chip, Field, H2, InlineNotice, P, Row, Screen, Segmented, ToggleRow } from '@/components/ui';
import { addSource, createPlace, getCategories, getCollections, getDedupeCandidates, savePlace, type SourceInput } from '@/lib/data';
import { DUPLICATE_REASON_LABELS, findDuplicates, type DuplicateMatch } from '@/lib/dedupe';
import { formatDate, hostOf } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/tokens';
import { SOURCE_TYPE_LABELS } from '@/lib/types';
import { OSM_ATTRIBUTION, suggestFromOsm } from '@/lib/osm';
import { parseSharedUrl, type ParsedUrl } from '@/lib/urlParse';
import { useLoad } from '@/lib/useLoad';

/** Añadir lugar: pegar una URL (TikTok, Instagram, Google Maps, web…) o alta manual. RF-03. */
export default function NewPlace() {
  const { activeCity, profile, bump } = useSession();
  const lists = useLoad(getCollections, []);
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [form, setForm] = useState<PlaceFormValue>(EMPTY_PLACE_FORM);
  const [note, setNote] = useState('');
  const [listIds, setListIds] = useState<number[]>([]);
  const [editorial, setEditorial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dups, setDups] = useState<DuplicateMatch[] | null>(null);
  const [busy, setBusy] = useState(false);
  // Sugerencias de OpenStreetMap a partir de las coordenadas del enlace. `date` = cuándo se consultó.
  const [osm, setOsm] = useState<{ status: 'idle' | 'loading' | 'done'; address: string | null; categorySlug: string | null; date: string }>({
    status: 'idle',
    address: null,
    categorySlug: null,
    date: '',
  });
  // Solo cuenta la última consulta: si se pega otro enlace mientras tanto, la respuesta anterior se descarta.
  const osmRequest = useRef(0);

  function readUrl() {
    const p = parseSharedUrl(url);
    if (!p) return setUrlError('Eso no parece un enlace. Cópialo entero desde la app (empieza por https://).');
    setUrlError(null);
    setParsed(p);
    // Solo se rellena lo que viene en la propia URL; el resto lo completas tú.
    setForm((f) => ({ ...f, name: f.name || p.name || '', coords: f.coords || (p.lat != null ? `${p.lat}, ${p.lng}` : '') }));
    const req = ++osmRequest.current;
    if (p.lat == null || p.lng == null) {
      setOsm({ status: 'idle', address: null, categorySlug: null, date: '' });
      return;
    }
    setOsm({ status: 'loading', address: null, categorySlug: null, date: '' });
    suggestFromOsm(p.lat, p.lng, p.name).then(async (s) => {
      if (req !== osmRequest.current) return;
      const categoryId = s.categorySlug ? ((await getCategories()).find((c) => c.slug === s.categorySlug)?.id ?? null) : null;
      if (req !== osmRequest.current) return;
      // Dirección y categoría solo se rellenan si están vacías: lo que ya elegiste no se pisa.
      setForm((f) => ({ ...f, address: f.address || s.address || '', categoryId: f.categoryId ?? categoryId }));
      setOsm({ status: 'done', address: s.address, categorySlug: s.categorySlug, date: new Date().toISOString() });
    });
  }

  /** Texto del aviso: qué se ha sugerido, de dónde y cuándo; y qué no se ha encontrado. */
  function osmMessage(): string {
    const found = [osm.address ? 'la dirección' : null, osm.categorySlug ? 'la categoría' : null].filter(Boolean) as string[];
    const missing = [osm.address ? null : 'la dirección', osm.categorySlug ? null : 'la categoría'].filter(Boolean) as string[];
    const parts: string[] = [];
    if (found.length) parts.push(`Sugerido por OpenStreetMap (${formatDate(osm.date)}): ${found.join(' y ')}. Compruébalo antes de guardar.`);
    if (missing.length) parts.push(`No encontramos ${missing.join(' ni ')} en OpenStreetMap: complétalo tú.`);
    return `${parts.join(' ')} ${OSM_ATTRIBUTION}.`;
  }

  const source: SourceInput | undefined = parsed
    ? { sourceType: parsed.sourceType, url: parsed.url, normalizedUrl: parsed.normalizedUrl, externalId: parsed.externalId, label: hostOf(parsed.url) }
    : undefined;

  async function submit(force = false) {
    const input = formToInput(form, activeCity?.id ?? null);
    if (typeof input === 'string') return setError(input);
    setError(null);
    setBusy(true);
    try {
      if (!force) {
        const found = findDuplicates(
          { name: input.name, address: input.address, lat: input.lat, lng: input.lng, externalId: parsed?.externalId, normalizedUrl: parsed?.normalizedUrl },
          await getDedupeCandidates(),
        );
        if (found.length) {
          setDups(found);
          setBusy(false);
          return;
        }
      }
      const id = await createPlace(input, { source, note, collectionIds: listIds, editorial: editorial && profile?.role === 'admin' });
      bump();
      router.replace(`/lugar/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function pickExisting(placeId: number) {
    setBusy(true);
    try {
      await savePlace(placeId, note);
      if (source) await addSource(placeId, source);
      bump();
      router.replace(`/lugar/${placeId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const showForm = mode === 'manual' || parsed;

  return (
    <Screen contentStyle={{ maxWidth: 720 }}>
      <Segmented
        label="Cómo añadirlo"
        value={mode}
        onChange={(m) => (setMode(m), setDups(null))}
        options={[
          { value: 'url', label: 'Pegar enlace', icon: 'link' },
          { value: 'manual', label: 'Alta manual', icon: 'pencil' },
        ]}
      />

      {mode === 'url' ? (
        <Card>
          <H2>Pega el enlace</H2>
          <P muted style={{ fontSize: 14 }}>
            De TikTok, Instagram, Google Maps o cualquier web. Guardamos el enlace como fuente; no leemos ni copiamos su contenido.
          </P>
          <Field
            label="Enlace"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            inputMode="url"
            placeholder="https://…"
            onSubmitEditing={readUrl}
            error={urlError}
          />
          <Button title="Usar este enlace" icon="link" onPress={readUrl} style={{ alignSelf: 'flex-start' }} />
          {parsed ? (
            <Row gap={space[1]} wrap>
              <Badge label={SOURCE_TYPE_LABELS[parsed.sourceType]} tone="blue" />
              {parsed.name ? <Badge label="Nombre detectado" icon="check" /> : null}
              {parsed.lat != null ? <Badge label="Ubicación detectada" icon="pin" /> : null}
            </Row>
          ) : null}
          {parsed && !parsed.name ? (
            <P muted style={{ fontSize: 14 }}>
              Completa el nombre y la categoría de lo que viste.
            </P>
          ) : null}
          {osm.status === 'loading' ? (
            <P muted style={{ fontSize: 14 }}>
              Buscando dirección y categoría en OpenStreetMap…
            </P>
          ) : null}
          {osm.status === 'done' ? <InlineNotice tone="info">{osmMessage()}</InlineNotice> : null}
        </Card>
      ) : null}

      {showForm ? (
        <>
          <Card>
            <H2>El lugar</H2>
            <PlaceFields value={form} onChange={(v) => (setForm(v), setDups(null))} showDescription={editorial} />
          </Card>
          <Card>
            <H2>Para ti</H2>
            <Field label="Nota privada" optional multiline value={note} onChangeText={setNote} placeholder="¿Por qué lo guardas? Solo lo verás tú." />
            {lists.data?.length ? (
              <Row wrap accessibilityLabel="Listas">
                {lists.data.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.name}
                    selected={listIds.includes(l.id)}
                    onPress={() => setListIds((x) => (x.includes(l.id) ? x.filter((i) => i !== l.id) : [...x, l.id]))}
                  />
                ))}
              </Row>
            ) : null}
            {profile?.role === 'admin' ? (
              <ToggleRow
                label="Ficha editorial pública"
                hint="Visible para todos en Descubrir y el mapa. Solo administradores."
                value={editorial}
                onChange={setEditorial}
              />
            ) : null}
          </Card>

          {dups?.length ? (
            <Card style={{ borderColor: colors.accentText }}>
              <H2>¿Es alguno de estos?</H2>
              <P muted style={{ fontSize: 14 }}>
                Para no duplicar fichas, mira si ya existe. Tú decides.
              </P>
              {dups.map((dp) => (
                <View key={dp.placeId} style={{ gap: space[2], paddingVertical: space[2] }}>
                  <P>{dp.name}</P>
                  <P muted style={{ fontSize: 14 }}>
                    {[DUPLICATE_REASON_LABELS[dp.reason], dp.address].filter(Boolean).join(' · ')}
                  </P>
                  <Button
                    title="Es este: guardarlo"
                    variant="secondary"
                    icon="check"
                    onPress={() => pickExisting(dp.placeId)}
                    disabled={busy}
                    style={{ alignSelf: 'flex-start' }}
                  />
                </View>
              ))}
              <Button title="No, es otro: crear ficha nueva" variant="ghost" onPress={() => submit(true)} loading={busy} style={{ alignSelf: 'flex-start' }} />
            </Card>
          ) : null}

          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          {!dups?.length ? <Button title="Guardar lugar" icon="bookmark" onPress={() => submit(false)} loading={busy} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
