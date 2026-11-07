// RUVAK, la mascota: ilustraciones de producción en assets/ruvak/ (generadas por
// scripts/prepare-ruvak.mjs desde assets/ruvak/originales). Solo se escalan y recortan; nunca se
// redibujan (documento §9 y §12, docs/mascota.md). Siempre decorativas: el texto lleva el mensaje.
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, typography } from '@/lib/tokens';
import { Button } from './ui';

/** Poses disponibles. Para añadir una: original en assets/ruvak/originales, prepare-ruvak.mjs y aquí. */
const POSES = {
  'gato-cabeza': { source: require('../../assets/ruvak/ruvak_gato_cabeza_v1.webp'), ratio: 780 / 900 },
  'gato-sentado': { source: require('../../assets/ruvak/ruvak_gato_sentado_v1.webp'), ratio: 556 / 900 },
  'grajo-vuelo': { source: require('../../assets/ruvak/ruvak_grajo_vuelo_v1.webp'), ratio: 900 / 645 },
  'grajo-ataque': { source: require('../../assets/ruvak/ruvak_grajo_ataque_v1.webp'), ratio: 900 / 600 },
  transformacion: { source: require('../../assets/ruvak/ruvak_transformacion_secuencia_v1.webp'), ratio: 1600 / 476 },
} as const;

export type RuvakPose = keyof typeof POSES;
/** Gato a pie por la ciudad; grajo entre ciudades (§9). */
export type RuvakForm = 'cat' | 'rook';

const HIDDEN = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true };

/** Ilustración a una altura dada (el ancho sale de la proporción de la pose). */
export function RuvakIllustration({ pose, height, maxWidth }: { pose: RuvakPose; height: number; maxWidth?: number }) {
  const { source, ratio } = POSES[pose];
  // Con maxWidth se adapta al ancho disponible (sin salirse en móvil) manteniendo la proporción.
  const box = maxWidth ? { width: '100%' as const, maxWidth: Math.min(height * ratio, maxWidth), aspectRatio: ratio } : { width: height * ratio, height };
  return (
    <View {...HIDDEN} style={box}>
      <Image source={source} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={0} />
    </View>
  );
}

/** Avatar pequeño: cabeza del gato o el grajo en vuelo. */
export function RuvakAvatar({ form = 'cat', size = 56 }: { form?: RuvakForm; size?: number }) {
  const pose: RuvakPose = form === 'cat' ? 'gato-cabeza' : 'grajo-vuelo';
  const { source } = POSES[pose];
  return (
    <View {...HIDDEN} style={{ width: size, height: size }}>
      <Image source={source} style={{ width: size, height: size }} contentFit="contain" transition={0} />
    </View>
  );
}

/** Marca: cabeza + «RUVAK» en Space Grotesk. */
export function RuvakWordmark({ size = 28 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }} accessible accessibilityRole="header" accessibilityLabel="RUVAK">
      <RuvakAvatar size={size * 1.25} />
      <Text style={{ ...typography.title, fontSize: size, lineHeight: size * 1.15, letterSpacing: size * 0.08, color: colors.text }}>RUVAK</Text>
    </View>
  );
}

/**
 * Estado vacío con RUVAK: qué falta y una acción concreta (§11). Mensajes breves.
 * No usar para errores graves ni mensajes de privacidad (para eso, ErrorState / InlineNotice).
 */
export function RuvakEmptyState({
  title,
  text,
  form = 'cat',
  pose,
  action,
  secondary,
}: {
  title: string;
  text?: string;
  form?: RuvakForm;
  pose?: RuvakPose;
  action?: { label: string; onPress: () => void };
  secondary?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <RuvakIllustration pose={pose ?? (form === 'cat' ? 'gato-sentado' : 'grajo-vuelo')} height={150} maxWidth={260} />
      <Text style={[typography.section, styles.center, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {text ? <Text style={[typography.body, styles.center, { color: colors.textSecondary }]}>{text}</Text> : null}
      {action ? <Button title={action.label} onPress={action.onPress} /> : null}
      {secondary}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space[3], paddingVertical: space[8], paddingHorizontal: space[4], maxWidth: 480, alignSelf: 'center' },
  center: { textAlign: 'center' },
});
