// RUVAK, la mascota. ⚠️ PROVISIONAL: siluetas geométricas mínimas hasta tener los PNG de producción
// sacados de la lámina maestra del personaje (documento §9 y §12, docs/mascota.md). Cuando lleguen,
// se sustituye el contenido de este archivo por <Image> de assets/ruvak/ sin cambiar la API.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, space, typography } from '@/lib/tokens';
import { Button } from './ui';

export type RuvakForm = 'cat' | 'rook';

/** Silueta decorativa (oculta a lectores de pantalla). Gato a pie por la ciudad; grajo entre ciudades. */
export function RuvakAvatar({ form = 'cat', size = 56 }: { form?: RuvakForm; size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {form === 'cat' ? (
          <>
            {/* Cabeza angular de gato, orejas afiladas */}
            <Path d="M10 6 L24 20 L40 20 L54 6 L56 34 L46 52 L32 58 L18 52 L8 34 Z" fill={colors.surface0} stroke={colors.outline} strokeWidth={1.5} />
            <Path d="M17 33 L27 30 L25 37 Z" fill={colors.lime} />
            <Path d="M47 33 L37 30 L39 37 Z" fill={colors.lime} />
            <Path d="M30 45 L34 45 L32 48 Z" fill={colors.textSecondary} />
          </>
        ) : (
          <>
            {/* Grajo de perfil: plumaje liso y pico afilado */}
            <Path d="M6 30 L22 22 L34 10 L48 14 L58 26 L48 30 L44 44 L30 56 L22 50 L26 38 Z" fill={colors.surface0} stroke={colors.outline} strokeWidth={1.5} />
            <Path d="M48 14 L62 18 L50 22 Z" fill={colors.textSecondary} />
            <Circle cx={42} cy={18} r={3} fill={colors.lime} />
          </>
        )}
      </Svg>
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
  action,
  secondary,
}: {
  title: string;
  text?: string;
  form?: RuvakForm;
  action?: { label: string; onPress: () => void };
  secondary?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <RuvakAvatar form={form} size={88} />
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
