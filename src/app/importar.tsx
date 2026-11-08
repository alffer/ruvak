import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Badge, Button, Card, H2, InlineNotice, Loading, P, Row, Screen } from '@/components/ui';
import { getDedupeCandidates, runImport, type ImportDecision, type ImportOutcome } from '@/lib/data';
import { DUPLICATE_REASON_LABELS, findDuplicates, type DuplicateMatch } from '@/lib/dedupe';
import { plural } from '@/lib/format';
import { useSession } from '@/lib/session';
import { ImportFormatError, parseTakeoutFile, type ImportParseResult } from '@/lib/takeout';
import { colors, iconSize, radii, space, themed, touchTarget, typography } from '@/lib/tokens';

type Step = 'pick' | 'preview' | 'running' | 'done';

/**
 * Importar desde Google Takeout (RF-04): leer el archivo (sin modificarlo), vista previa, elegir
 * qué importar, resolver duplicados y resumen final con omitidos, incompletos y duplicados.
 */
export default function ImportScreen() {
  const { activeCity, bump } = useSession();
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ImportParseResult | null>(null);
  const [dups, setDups] = useState<Map<number, DuplicateMatch[]>>(new Map());
  const [decisions, setDecisions] = useState<Map<number, ImportDecision>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  async function pick() {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/geo+json', 'text/csv', 'text/comma-separated-values', '*/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    try {
      // Solo lectura: el archivo original no se toca.
      const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
      const result = parseTakeoutFile(asset.name, text);
      if (!result.items.length) return setError('El archivo no tiene lugares que se puedan importar.');
      const candidates = await getDedupeCandidates();
      const d = new Map<number, DuplicateMatch[]>();
      const dec = new Map<number, ImportDecision>();
      // También duplicados dentro del propio archivo (mismo enlace o identificador).
      const seen = new Map<string, number>();
      for (const it of result.items) {
        const m = findDuplicates(
          { name: it.name, address: it.address, lat: it.lat, lng: it.lng, externalId: it.externalId, normalizedUrl: it.normalizedUrl },
          candidates,
        );
        if (m.length) d.set(it.index, m);
        const key = it.externalId ?? it.normalizedUrl;
        const repeated = key != null && seen.has(key);
        if (key && !repeated) seen.set(key, it.index);
        // Por defecto: lo nuevo se importa; lo que ya existe se vincula a la ficha existente; repetidos, se omiten.
        dec.set(it.index, repeated ? { kind: 'skip' } : m.length ? { kind: 'link', placeId: m[0].placeId } : { kind: 'new' });
      }
      setFileName(asset.name);
      setParsed(result);
      setDups(d);
      setDecisions(dec);
      setStep('preview');
    } catch (e) {
      setError(e instanceof ImportFormatError ? e.message : `No se pudo leer el archivo: ${(e as Error).message}`);
    }
  }

  const counts = useMemo(() => {
    const c = { new: 0, link: 0, skip: 0 };
    for (const d of decisions.values()) c[d.kind]++;
    return c;
  }, [decisions]);

  async function start() {
    if (!parsed) return;
    setStep('running');
    setProgress(0);
    const out = await runImport(fileName, parsed.items, decisions, activeCity?.id ?? null, setProgress);
    setOutcome(out);
    setStep('done');
    bump();
  }

  const setAll = (kind: 'new' | 'skip') =>
    setDecisions((cur) => {
      const next = new Map(cur);
      for (const it of parsed?.items ?? []) {
        const existing = cur.get(it.index);
        if (kind === 'skip') next.set(it.index, { kind: 'skip' });
        else if (existing?.kind === 'skip')
          next.set(it.index, dups.get(it.index)?.length ? { kind: 'link', placeId: dups.get(it.index)![0].placeId } : { kind: 'new' });
      }
      return next;
    });

  if (step === 'running')
    return (
      <Screen>
        <Loading label={`Importando ${progress} de ${parsed?.items.length ?? 0}…`} />
      </Screen>
    );

  if (step === 'done' && outcome)
    return (
      <Screen contentStyle={{ maxWidth: 720 }}>
        <InlineNotice tone={outcome.errors.length ? 'warning' : 'success'}>
          {`Importación terminada: ${plural(outcome.imported, 'lugar nuevo', 'lugares nuevos')}, ${plural(outcome.linked, 'vinculado', 'vinculados')} a fichas existentes y ${plural(outcome.skipped, 'omitido', 'omitidos')}.`}
        </InlineNotice>
        {parsed?.omitted.length ? (
          <P
            muted
          >{`${plural(parsed.omitted.length, 'registro del archivo no tenía', 'registros del archivo no tenían')} datos suficientes y no se importaron.`}</P>
        ) : null}
        {outcome.errors.length ? (
          <Card>
            <H2>Errores</H2>
            {outcome.errors.slice(0, 20).map((e) => (
              <P key={e} muted style={{ fontSize: 14 }}>
                {e}
              </P>
            ))}
          </Card>
        ) : null}
        <Button title="Ver mis lugares" onPress={() => router.navigate('/lugares')} />
      </Screen>
    );

  if (step === 'preview' && parsed)
    return (
      <Screen contentStyle={{ maxWidth: 820 }}>
        <Card>
          <H2>{fileName}</H2>
          <P muted>
            {`${plural(parsed.items.length, 'lugar encontrado', 'lugares encontrados')}${parsed.omitted.length ? ` · ${plural(parsed.omitted.length, 'registro omitido', 'registros omitidos')} por falta de datos` : ''}`}
          </P>
          <Row gap={space[1]} wrap>
            <Badge label={`${counts.new} nuevos`} tone="blue" />
            <Badge label={`${counts.link} ya existen: se vinculan`} />
            <Badge label={`${counts.skip} omitidos`} />
            {[...parsed.items].filter((i) => i.lat == null).length ? (
              <Badge label={`${parsed.items.filter((i) => i.lat == null).length} sin ubicación`} icon="alert" tone="warning" />
            ) : null}
          </Row>
          <Row gap={space[2]} wrap>
            <Button title="Marcar todos" variant="secondary" onPress={() => setAll('new')} />
            <Button title="Desmarcar todos" variant="secondary" onPress={() => setAll('skip')} />
          </Row>
        </Card>
        <View style={{ gap: space[2] }}>
          {parsed.items.map((it) => {
            const d = decisions.get(it.index) ?? { kind: 'skip' };
            const matches = dups.get(it.index) ?? [];
            const included = d.kind !== 'skip';
            return (
              <Card key={it.index} style={{ gap: space[2] }}>
                <Pressable
                  onPress={() =>
                    setDecisions((cur) =>
                      new Map(cur).set(
                        it.index,
                        included ? { kind: 'skip' } : matches.length ? { kind: 'link', placeId: matches[0].placeId } : { kind: 'new' },
                      ),
                    )
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: included }}
                  accessibilityLabel={`Importar ${it.name}`}
                  style={styles.check}
                >
                  <View style={[styles.box, included && styles.boxOn]}>
                    {included ? <Icon name="check" size={iconSize.sm} color={colors.onPrimary} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>{it.name}</Text>
                    {it.address ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{it.address}</Text> : null}
                    {it.listName ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{`Lista: ${it.listName}`}</Text> : null}
                    {it.note ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{`Nota: ${it.note}`}</Text> : null}
                  </View>
                </Pressable>
                {it.problems.length ? (
                  <Row gap={space[1]} wrap>
                    {it.problems.map((p) => (
                      <Badge key={p} label={p} icon="alert" tone="warning" />
                    ))}
                  </Row>
                ) : null}
                {matches.length && included ? (
                  <View style={styles.dup}>
                    <Text style={[typography.label, { color: colors.accentText }]}>Posible duplicado</Text>
                    {matches.slice(0, 3).map((m) => (
                      <Pressable
                        key={m.placeId}
                        onPress={() => setDecisions((cur) => new Map(cur).set(it.index, { kind: 'link', placeId: m.placeId }))}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: d.kind === 'link' && d.placeId === m.placeId }}
                        style={styles.option}
                      >
                        <Icon name={d.kind === 'link' && d.placeId === m.placeId ? 'check-circle' : 'pending'} color={colors.text} size={iconSize.md} />
                        <Text
                          style={[typography.body, { color: colors.text, flex: 1 }]}
                        >{`Es «${m.name}» (${DUPLICATE_REASON_LABELS[m.reason].toLowerCase()})`}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => setDecisions((cur) => new Map(cur).set(it.index, { kind: 'new' }))}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: d.kind === 'new' }}
                      style={styles.option}
                    >
                      <Icon name={d.kind === 'new' ? 'check-circle' : 'pending'} color={colors.text} size={iconSize.md} />
                      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>Es otro lugar: crear ficha nueva</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
        <Button title={`Importar ${counts.new + counts.link} lugares`} icon="upload" onPress={start} disabled={counts.new + counts.link === 0} />
        <Button title="Elegir otro archivo" variant="ghost" onPress={() => setStep('pick')} />
      </Screen>
    );

  return (
    <Screen contentStyle={{ maxWidth: 720 }}>
      <Card>
        <H2>Trae tus guardados de Google Maps</H2>
        <P muted>Google no deja leer tus listas directamente. Puedes exportarlas con Google Takeout e importarlas aquí:</P>
        {[
          'Entra en takeout.google.com y marca solo «Guardado» y «Maps (tus sitios)».',
          'Descarga el .zip y descomprímelo.',
          'Elige aquí «Saved Places.json» o el .csv de una lista (carpeta «Guardado»).',
        ].map((s, i) => (
          <Row key={s} gap={space[2]} style={{ alignItems: 'flex-start' }}>
            <Text style={[typography.bodyStrong, { color: colors.accentText, width: 20 }]}>{i + 1}.</Text>
            <P style={{ flex: 1 }}>{s}</P>
          </Row>
        ))}
        <InlineNotice>Verás una vista previa antes de importar nada. Tu archivo no se modifica y no hay sincronización automática con Google.</InlineNotice>
      </Card>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Button title="Elegir archivo" icon="upload" onPress={pick} />
      <Button title="O añadir un lugar a mano o con un enlace" variant="ghost" onPress={() => router.push('/lugar/nuevo')} />
    </Screen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    check: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start', minHeight: touchTarget },
    box: {
      width: 24,
      height: 24,
      borderRadius: radii.xs,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    dup: { gap: space[1], padding: space[3], borderRadius: radii.sm, borderWidth: 1, borderColor: colors.accentText },
    option: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: touchTarget },
  }),
);
