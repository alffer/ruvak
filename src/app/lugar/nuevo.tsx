import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { EMPTY_PLACE_FORM, formToInput, PlaceFields, type PlaceFormValue } from '@/components/PlaceForm';
import { Badge, Button, Card, Chip, Field, H2, InlineNotice, P, Row, Screen, Segmented, ToggleRow } from '@/components/ui';
import { addSource, createPlace, getCategories, getCollections, getDedupeCandidates, savePlace, type SourceInput } from '@/lib/data';
import { DUPLICATE_REASON_LABELS, findDuplicates, type DuplicateMatch } from '@/lib/dedupe';
import { formatDate, hostOf } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/tokens';
import { SOURCE_TYPE_LABELS } from '@/lib/types';
import { OSM_ATTRIBUTION, osmSource, suggestFromOsm } from '@/lib/osm';
import { parseSharedUrl, type ParsedUrl } from '@/lib/urlParse';
import { useLoad } from '@/lib/useLoad';

interface OsmView {
  status: 'idle' | 'loading' | 'done';
  date: string;
  foundAddress: boolean;
  foundCategory: boolean;
  appliedAddress: string | null;
  appliedCategoryId: number | null;
  keptAddress: boolean;
  keptCategory: boolean;
}

const IDLE_OSM: OsmView = {
  status: 'idle',
  date: '',
  foundAddress: false,
  foundCategory: false,
  appliedAddress: null,
  appliedCategoryId: null,
  keptAddress: false,
  keptCategory: false,
};

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
  // Sugerencias de OpenStreetMap a partir de las coordenadas del enlace. Guarda lo que de verdad se aplicó al formulario,
  // para que el aviso no afirme nada que no ha pasado.
  const [osm, setOsm] = useState<OsmView>(IDLE_OSM);
  // Solo cuenta la última consulta: si se pega otro enlace mientras tanto, la respuesta anterior se descarta.
  const osmRequest = useRef(0);
  // Copia del formulario para decidir qué rellenar sin depender de una lectura antigua.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  function readUrl() {
    const p = parseSharedUrl(url);
    if (!p) return setUrlError('Eso no parece un enlace. Cópialo entero desde la app (empieza por https://).');
    setUrlError(null);
    setParsed(p);
    // Solo se rellena lo que viene en la propia URL; el resto lo completas tú.
    setForm((f) => ({ ...f, name: f.name || p.name || '', coords: f.coords || (p.lat != null ? `${p.lat}, ${p.lng}` : '') }));
    const req = ++osmRequest.current;
    if (p.lat == null || p.lng == null) {
      setOsm(IDLE_OSM);
      return;
    }
    setOsm({ ...IDLE_OSM, status: 'loading' });
    suggestFromOsm(p.lat, p.lng, p.name)
      .then(async (s) => {
        const categoryId = s.categorySlug ? ((await getCategories()).find((c) => c.slug === s.categorySlug)?.id ?? null) : null;
        if (req !== osmRequest.current) return;
        const cur = formRef.current;
        const applyAddress = !cur.address.trim() && !!s.address;
        const applyCategory = cur.categoryId == null && categoryId != null;
        setForm((f) => ({
          ...f,
          address: f.address.trim() ? f.address : (s.address ?? ''),
          categoryId: f.categoryId ?? categoryId,
        }));
        setOsm({
          status: 'done',
          date: new Date().toISOString(),
          foundAddress: !!s.address,
          foundCategory: categoryId != null,
          appliedAddress: applyAddress ? s.address : null,
          appliedCategoryId: applyCategory ? categoryId : null,
          keptAddress: cur.address.trim().length > 0 && !!s.address,
          keptCategory: cur.categoryId != null && categoryId != null,
        });
      })
      .catch(() => {
        // Sin conexión o con error: se trata como «no encontrado», sin mensaje técnico ni aviso colgado.
        if (req !== osmRequest.current) return;
        setOsm({ ...IDLE_OSM, status: 'done', date: new Date().toISOString() });
      });
  }

  /** Aviso: qué se ha rellenado, qué ya estaba escrito, qué no se ha encontrado, de dónde y cuándo. */
  function osmMessage(): string {
    const date = formatDate(osm.date);
    const applied = [osm.appliedAddress ? 'la dirección' : null, osm.appliedCategoryId != null ? 'la categoría' : null].filter(Boolean) as string[];
    const kept = [osm.keptAddress ? 'la dirección' : null, osm.keptCategory ? 'la categoría' : null].filter(Boolean) as string[];
    const missing = [osm.foundAddress ? null : 'la dirección', osm.foundCategory ? null : 'la categoría'].filter(Boolean) as string[];
    const hasData = osm.foundAddress || osm.foundCategory;
    if (!hasData) return `No encontramos dirección ni categoría para este punto en OpenStreetMap (consulta del ${date}). Complétalas tú.`;
    const parts: string[] = [];
    if (applied.length)
      parts.push(
        `Propuesta de OpenStreetMap (mapa abierto que editan voluntarios), consultada el ${date}: hemos rellenado ${applied.join(' y ')}. Sin verificar: compruébalo antes de guardar.`,
      );
    if (kept.length) parts.push(`Ya habías escrito ${kept.join(' y ')}; lo hemos dejado.`);
    if (missing.length) parts.push(`No encontramos ${missing.join(' ni ')} en OpenStreetMap: complétalo tú.`);
    parts.push(`Datos: ${OSM_ATTRIBUTION}.`);
    return parts.join(' ');
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
      // Si OpenStreetMap ha rellenado dirección o categoría, su procedencia y su fecha quedan registradas.
      const osmFilled = osm.status === 'done' && (osm.appliedAddress || osm.appliedCategoryId != null);
      if (osmFilled && parsed?.lat != null && parsed?.lng != null) {
        try {
          await addSource(id, osmSource(parsed.lat, parsed.lng, osm.date));
        } catch {
          setError('El lugar se guardó, pero no se pudo registrar la fuente de OpenStreetMap. Puedes añadirla desde la ficha.');
          setBusy(false);
          return;
        }
      }
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
          {/* Región «en vivo» presente desde el inicio: así los lectores de pantalla anuncian el cambio de texto. */}
          <View accessibilityLiveRegion="polite">
            {osm.status === 'loading' ? (
              <P muted style={{ fontSize: 14 }}>
                Buscando dirección y categoría en OpenStreetMap…
              </P>
            ) : null}
            {osm.status === 'done' ? <InlineNotice tone="info">{osmMessage()}</InlineNotice> : null}
          </View>
        </Card>
      ) : null}

      {showForm ? (
        <>
          <Card>
            <H2>El lugar</H2>
            <PlaceFields
              value={form}
              onChange={(v) => (setForm(v), setDups(null))}
              showDescription={editorial}
              suggested={{ address: osm.appliedAddress, categoryId: osm.appliedCategoryId }}
            />
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
