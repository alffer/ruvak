// Tarjetas y etiquetas de lugares y de contenido editorial.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, hostOf, openExternal } from '@/lib/format';
import { colors, iconSize, radii, space, states, touchTarget, typography } from '@/lib/tokens';
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
        <Icon name="pin" color={place.lat != null ? colors.blueText : colors.textSecondary} size={iconSize.lg} />
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
            <Icon name="sparkles" color={colors.lime} size={iconSize.sm} />
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
      <Icon name={icon} size={iconSize.sm} color={pressed ? colors.blueText : colors.text} />
      <Text style={[typography.label, { color: pressed ? colors.blueText : colors.text }]}>{label}</Text>
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
            <Text style={[typography.caption, { color: colors.blueText, textDecorationLine: 'underline' }]}>Abrir fuente ({hostOf(url)})</Text>
            <Icon name="external" size={14} color={colors.blueText} />
          </Row>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  thumb: { width: 48, height: 48, borderRadius: radii.sm, backgroundColor: colors.surface0, alignItems: 'center', justifyContent: 'center' },
  cover: { padding: space[4], paddingTop: space[6], gap: space[1], backgroundColor: colors.surface0, borderBottomWidth: 3, borderBottomColor: colors.lime },
  smallBtn: {
    minHeight: touchTarget - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
});
