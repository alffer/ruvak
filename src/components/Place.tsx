// Tarjetas y etiquetas de lugares y de contenido editorial.
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, hostOf, openExternal } from '@/lib/format';
import { brand, colors, iconSize, radii, space, states, themed, touchTarget, typography } from '@/lib/tokens';
import {
  DISCOVERY_KIND_LABELS,
  VERIFICATION_LABELS,
  VISIT_STATUS_LABELS,
  type DiscoveryItem,
  type DiscoveryKind,
  type SavedPlace,
  type Verification,
  type VisitStatus,
} from '@/lib/types';
import { Icon, type IconName } from './Icon';
import { Badge, Card, Row, type BadgeTone } from './ui';

const STATUS_ICON: Record<VisitStatus, IconName> = { pending: 'pending', visited: 'check-circle', discarded: 'ban' };

export function PlaceStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge label={VISIT_STATUS_LABELS[status]} icon={STATUS_ICON[status]} tone={status === 'visited' ? 'blue' : 'neutral'} />;
}

export function VerificationBadge({ v }: { v: Verification }) {
  const tone: BadgeTone =
    v === 'confirmed' ? 'blue' : v === 'closed' || v === 'cancelled' ? 'danger' : v === 'outdated' || v === 'unverified' ? 'warning' : 'neutral';
  const icon: IconName = v === 'confirmed' ? 'check-circle' : v === 'closed' || v === 'cancelled' ? 'ban' : 'alert';
  return <Badge label={VERIFICATION_LABELS[v]} tone={tone} icon={icon} />;
}

/** Novedades en naranja; el resto, neutro (§9: el naranja no se usa para todo). */
export function KindBadge({ kind }: { kind: DiscoveryKind }) {
  const isNews = kind === 'just_opened' || kind === 'upcoming_opening' || kind === 'announced';
  return <Badge label={DISCOVERY_KIND_LABELS[kind]} tone={isNews ? 'news' : 'neutral'} icon={isNews ? 'sparkles' : undefined} />;
}

/** Elemento de lista de la colección: nombre, categoría, zona, estado y avisos útiles. */
export function PlaceListItem({ place, categoryName }: { place: SavedPlace; categoryName: string | null }) {
  const meta = [categoryName, place.zone ?? place.address].filter(Boolean).join(' · ');
  const label = [place.name, meta, place.me.favorite ? 'favorito' : null, place.me.status ? VISIT_STATUS_LABELS[place.me.status] : null]
    .filter(Boolean)
    .join(', ');
  return (
    <Card onPress={() => router.push(`/lugar/${place.id}`)} accessibilityLabel={label} style={styles.item}>
      <View style={styles.thumb}>
        <Icon name="pin" color={place.lat != null ? colors.accentText : colors.textSecondary} size={iconSize.lg} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row gap={space[1]}>
          <Text style={[typography.cardTitle, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
            {place.name}
          </Text>
          {place.me.favorite ? <Icon name="heart" color={colors.newsText} fill={colors.newsText} size={iconSize.sm} /> : null}
        </Row>
        {meta ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Row gap={space[1]} wrap>
          {place.me.status ? <PlaceStatusBadge status={place.me.status} /> : null}
          {place.lat == null ? <Badge label="Sin ubicación" icon="alert" /> : null}
          {place.isEditorial ? <Badge label="RUVAK" tone="blue" /> : null}
          {place.archived ? <Badge label="Archivado" icon="archive" /> : null}
        </Row>
      </View>
      <Icon name="chevron-right" color={colors.textSecondary} />
    </Card>
  );
}

/** Tarjeta editorial: fotografía si la hay (con crédito), tipo, estado de verificación, fuente y fecha. */
export function DiscoveryCard({
  item,
  reason,
  saved,
  onSave,
  onHide,
}: {
  item: DiscoveryItem;
  reason: string | null;
  saved: boolean;
  onSave: () => void;
  onHide: () => void;
}) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      {item.imageUrl ? (
        <View>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface0 }}
            contentFit="cover"
            accessibilityLabel={item.title}
            transition={0}
          />
          {item.imageCredit ? (
            <Text style={[typography.caption, { color: colors.textSecondary, paddingHorizontal: space[4], paddingTop: space[1] }]}>
              Foto: {item.imageCredit}
            </Text>
          ) : null}
        </View>
      ) : null}
      {/* Sin foto autorizada no se inventa una: bloque tipográfico. */}
      <View style={styles.cover}>
        <Text style={[typography.overline, { color: colors.textSecondary }]}>{item.place?.zone ?? 'Gijón'}</Text>
        <Text style={[typography.section, { color: colors.text }]} accessibilityRole="header" aria-level={3}>
          {item.title}
        </Text>
      </View>
      <View style={{ padding: space[4], gap: space[3] }}>
        <Row gap={space[1]} wrap>
          <KindBadge kind={item.kind} />
          <VerificationBadge v={item.verification} />
        </Row>
        {item.summary ? <Text style={[typography.body, { color: colors.text }]}>{item.summary}</Text> : null}
        {reason ? (
          <Row gap={space[1]}>
            <Icon name="sparkles" color={colors.accentText} size={iconSize.sm} />
            <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>{reason}</Text>
          </Row>
        ) : null}
        <SourceLine
          name={item.sourceName}
          url={item.sourceUrl}
          date={item.verifiedAt ?? item.updatedAt}
          dateLabel={item.verifiedAt ? 'Verificado' : 'Actualizado'}
        />
        <Row gap={space[2]} wrap>
          {item.place ? <DiscoveryButton icon="pin" label="Ver ficha" onPress={() => router.push(`/lugar/${item.place!.id}`)} /> : null}
          {item.place ? (
            <DiscoveryButton icon={saved ? 'bookmark-check' : 'bookmark'} label={saved ? 'Guardado' : 'Guardar'} onPress={onSave} pressed={saved} />
          ) : null}
          <DiscoveryButton icon="hide" label="Ocultar" onPress={onHide} />
        </Row>
      </View>
    </Card>
  );
}

function DiscoveryButton({ icon, label, onPress, pressed }: { icon: IconName; label: string; onPress: () => void; pressed?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={pressed === undefined ? undefined : { selected: pressed }}
      style={({ pressed: p }) => [styles.smallBtn, { opacity: p ? states.pressedOpacity : 1 }]}
    >
      <Icon name={icon} size={iconSize.sm} color={pressed ? colors.accentText : colors.text} />
      <Text style={[typography.label, { color: pressed ? colors.accentText : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Fuente y fecha de un dato (§1: mostrar fuente y fecha de actualización). */
export function SourceLine({
  name,
  url,
  date,
  dateLabel = 'Actualizado',
}: {
  name: string | null;
  url: string | null;
  date: string | null;
  dateLabel?: string;
}) {
  const parts = [name ? `Fuente: ${name}` : 'Fuente: no indicada', date ? `${dateLabel} ${formatDate(date)}` : null].filter(Boolean).join(' · ');
  return (
    <View style={{ gap: 2 }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{parts}</Text>
      {url ? (
        <Pressable onPress={() => openExternal(url)} accessibilityRole="link" hitSlop={10}>
          <Row gap={4}>
            <Text style={[typography.caption, { color: colors.accentText, textDecorationLine: 'underline' }]}>Abrir fuente ({hostOf(url)})</Text>
            <Icon name="external" size={14} color={colors.accentText} />
          </Row>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    item: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
    thumb: { width: 48, height: 48, borderRadius: radii.sm, backgroundColor: colors.surface0, alignItems: 'center', justifyContent: 'center' },
    cover: {
      padding: space[4],
      paddingTop: space[6],
      gap: space[1],
      backgroundColor: colors.surface0,
      borderBottomWidth: 3,
      borderBottomColor: colors.accentText,
    },
    smallBtn: {
      minHeight: touchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1],
      paddingHorizontal: space[3],
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.outline,
    },
  }),
);

/** Acceso rápido por categoría (lámina): icono + nombre en un recuadro. */
export function CategoryShortcut({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [shortcut.box, { opacity: pressed ? states.pressedOpacity : 1 }]}
    >
      <Icon name={icon} size={iconSize.lg} color={colors.text} />
      <Text style={[typography.micro, { color: colors.text, letterSpacing: -0.3 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Tarjeta «de papel» de Recomendados (lámina): portada, título, zona y estado de verificación.
 * Sin foto autorizada no se inventa una: portada tinta con la categoría y la zona. Sin valoraciones (no hay datos).
 */
export function RecommendedCard({ item, categoryName, onPress }: { item: DiscoveryItem; categoryName: string | null; onPress: () => void }) {
  // La categoría ya está en la portada: abajo solo la zona (así no se trunca ni se repite).
  const where = item.place?.zone ?? '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={[item.title, categoryName, where, VERIFICATION_LABELS[item.verification]].filter(Boolean).join('. ')}
      style={({ pressed }) => [recCard.card, { opacity: pressed ? states.pressedOpacity : 1 }]}
    >
      {item.imageUrl ? (
        <View>
          <Image source={{ uri: item.imageUrl }} style={recCard.photo} contentFit="cover" accessibilityLabel={item.title} transition={0} />
          {item.imageCredit ? (
            <Text style={[typography.caption, { color: colors.onPaperSecondary, paddingHorizontal: space[3], paddingTop: 2 }]}>Foto: {item.imageCredit}</Text>
          ) : null}
        </View>
      ) : (
        <View style={recCard.cover}>
          <Text style={[typography.overline, { color: brand.cream }]}>{categoryName ?? 'Gijón'}</Text>
          <View style={recCard.stripe} />
        </View>
      )}
      <View style={{ padding: space[3], gap: space[1] }}>
        <Text style={[typography.cardTitle, { color: colors.onPaper }]} numberOfLines={2}>
          {item.title}
        </Text>
        {where ? (
          <Row gap={space[1]}>
            <Icon name="pin" size={iconSize.sm} color={colors.onPaperSecondary} />
            <Text style={[typography.caption, { color: colors.onPaperSecondary, flex: 1 }]} numberOfLines={1}>
              {where}
            </Text>
          </Row>
        ) : null}
        <Row gap={space[1]}>
          <Icon name={item.verification === 'confirmed' ? 'check-circle' : 'alert'} size={iconSize.sm} color={colors.onPaperSecondary} />
          <Text style={[typography.caption, { color: colors.onPaperSecondary }]}>{VERIFICATION_LABELS[item.verification]}</Text>
        </Row>
      </View>
    </Pressable>
  );
}

const shortcut = themed(() =>
  StyleSheet.create({
    box: {
      flexGrow: 1,
      flexBasis: 0,
      minHeight: 76,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space[1],
      paddingHorizontal: 0,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.card,
    },
  }),
);

const recCard = themed(() =>
  StyleSheet.create({
    card: { width: 232, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
    cover: { height: 72, padding: space[3], justifyContent: 'space-between', backgroundColor: brand.ink },
    stripe: { height: 4, width: 48, borderRadius: 2, backgroundColor: brand.lime },
    photo: { width: '100%', height: 92, backgroundColor: brand.ink },
  }),
);
