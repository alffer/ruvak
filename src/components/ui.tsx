// Componentes base reutilizables. Todo valor visual sale de src/lib/tokens.ts.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, iconSize, layout, radii, space, states, themed, touchTarget, typography } from '@/lib/tokens';
import { Icon, type IconName } from './Icon';

// ---------------------------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------------------------

/** Pantalla con scroll y ancho máximo en escritorio. */
export function Screen({ children, scroll = true, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const inner = <View style={[styles.screenInner, contentStyle]}>{children}</View>;
  if (!scroll) return <View style={styles.screen}>{inner}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

/** Guion bajo lima de la marca («Descubre Gijón_»). Decorativo: el lector de pantalla lo ignora. */
function Mark() {
  return (
    <Text aria-hidden accessibilityElementsHidden importantForAccessibility="no" style={{ color: colors.mark }}>
      _
    </Text>
  );
}

export function H1({ children, style, mark = true }: { children: ReactNode; style?: StyleProp<TextStyle>; mark?: boolean }) {
  return (
    <Text
      style={[typography.title, { color: colors.text }, style]}
      accessibilityRole="header"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      aria-level={1}
    >
      {children}
      {mark ? <Mark /> : null}
    </Text>
  );
}

export function H2({ children, style, mark = true }: { children: ReactNode; style?: StyleProp<TextStyle>; mark?: boolean }) {
  return (
    <Text
      style={[typography.section, { color: colors.text }, style]}
      accessibilityRole="header"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      aria-level={2}
    >
      {children}
      {mark ? <Mark /> : null}
    </Text>
  );
}

export function P({ children, muted, style, numberOfLines }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[typography.body, { color: muted ? colors.textSecondary : colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Overline({ children, color = colors.textSecondary }: { children: ReactNode; color?: string }) {
  return <Text style={[typography.overline, { color }]}>{children}</Text>;
}

/** Encabezado de sección con acción opcional a la derecha. */
export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <H2 style={{ flex: 1 }}>{title}</H2>
      {action ? <LinkButton label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, { opacity: pressed ? states.pressedOpacity : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Row({
  children,
  gap = space[2],
  style,
  wrap,
  accessibilityLabel,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessible={accessibilityLabel ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------------------------------

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** primary = lima (acción principal); solid = neutro sólido («Guardar»); secondary = contorno. */
  variant?: 'primary' | 'solid' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style, accessibilityHint }: ButtonProps) {
  const off = disabled || loading;
  const bg = variant === 'primary' ? colors.primary : variant === 'solid' ? colors.solid : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'solid'
        ? colors.onSolid
        : variant === 'danger'
          ? colors.danger
          : variant === 'ghost'
            ? colors.accentText
            : colors.text;
  const border = variant === 'secondary' ? colors.outline : variant === 'danger' ? colors.danger : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? states.disabledOpacity : pressed ? states.pressedOpacity : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonRow}>
          {icon ? <Icon name={icon} color={fg} size={iconSize.md} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={12}
      style={({ pressed }) => ({ opacity: pressed ? states.pressedOpacity : 1, paddingVertical: space[2] })}
    >
      <Text style={[typography.label, { color: colors.accentText }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, count }: { label: string; selected: boolean; onPress: () => void; icon?: IconName; count?: number }) {
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.raised,
          borderColor: selected ? colors.primary : colors.outline,
          opacity: pressed ? states.pressedOpacity : 1,
        },
      ]}
    >
      {/* Seleccionado se marca con ✓ además del color (§6: nunca solo color). */}
      {selected ? <Icon name="check" size={iconSize.sm} color={fg} /> : icon ? <Icon name={icon} size={iconSize.sm} color={fg} /> : null}
      <Text style={[typography.label, { color: fg }]}>{label}</Text>
      {count !== undefined ? <Text style={[typography.caption, { color: selected ? colors.onPrimary : colors.textSecondary }]}>{count}</Text> : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2], paddingVertical: space[1] }}>
      {children}
    </ScrollView>
  );
}

type FieldProps = TextInputProps & { label: string; hint?: string; error?: string | null; optional?: boolean };

export function Field({ label, hint, error, optional, style, multiline, ...rest }: FieldProps) {
  return (
    <View style={{ gap: space[1] }}>
      <Text style={[typography.label, { color: colors.text }]} nativeID={`lbl-${label}`}>
        {label}
        {optional ? <Text style={{ color: colors.textSecondary, fontFamily: fonts.body }}> (opcional)</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        aria-invalid={!!error}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: space[3] },
          error ? { borderColor: colors.danger } : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Row gap={space[1]}>
          <Icon name="alert" size={iconSize.sm} color={colors.danger} />
          <Text style={[typography.caption, { color: colors.danger, flex: 1 }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Row>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Buscador en píldora (lámina): icono de lupa + campo. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  label,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  label: string;
}) {
  return (
    <View style={styles.search}>
      <Icon name="search" color={colors.textSecondary} size={iconSize.md} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.searchInput, { color: colors.text }]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10}>
          <Icon name="x" color={colors.textSecondary} size={iconSize.md} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.raised }}
        thumbColor={colors.text}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

/** Selector segmentado (vista lista/cuadrícula, pestañas internas). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={label}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            style={[styles.segment, sel && { backgroundColor: colors.raised, borderColor: colors.outline }]}
          >
            {o.icon ? <Icon name={o.icon} size={iconSize.sm} color={sel ? colors.text : colors.textSecondary} /> : null}
            <Text style={[typography.label, { color: sel ? colors.text : colors.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Etiquetas y avisos
// ---------------------------------------------------------------------------------------------

export type BadgeTone = 'neutral' | 'news' | 'lime' | 'blue' | 'warning' | 'danger';

/** Etiqueta breve con icono + texto (el estado nunca va solo en el color). */
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const t = {
    neutral: { bg: colors.raised, fg: colors.text, border: colors.outline },
    news: { bg: colors.news, fg: colors.onNews, border: colors.news },
    lime: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    blue: { bg: 'transparent', fg: colors.accentText, border: colors.accentText },
    warning: { bg: 'transparent', fg: colors.newsText, border: colors.newsText },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon ? <Icon name={icon} size={14} color={t.fg} /> : null}
      <Text style={[typography.caption, { color: t.fg, fontFamily: fonts.bodyMedium }]}>{label}</Text>
    </View>
  );
}

export function InlineNotice({ children, tone = 'info', icon }: { children: ReactNode; tone?: 'info' | 'warning' | 'error' | 'success'; icon?: IconName }) {
  const c = { info: colors.accentText, warning: colors.newsText, error: colors.danger, success: colors.success }[tone];
  const i: IconName = icon ?? (tone === 'error' || tone === 'warning' ? 'alert' : tone === 'success' ? 'check-circle' : 'info');
  return (
    <View style={[styles.notice, { borderColor: c }]} accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite">
      <Icon name={i} color={c} size={iconSize.md} />
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.accentText} size="large" />
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** Esqueleto de carga para listas (sin animación: respeta movimiento reducido). */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: space[3] }} accessibilityRole="progressbar" accessibilityLabel="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </View>
  );
}

/** Error sin mascota (§11: la mascota no se usa en errores graves). */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ gap: space[3], paddingVertical: space[4] }}>
      <InlineNotice tone="error">{message}</InlineNotice>
      {onRetry ? <Button title="Reintentar" icon="refresh" variant="secondary" onPress={onRetry} style={{ alignSelf: 'flex-start' }} /> : null}
    </View>
  );
}

/** Confirmación multiplataforma (Alert en móvil, confirm en web). */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { flexGrow: 1 },
    screenInner: { width: '100%', maxWidth: layout.maxContent, alignSelf: 'center', padding: space[4], gap: space[5], paddingBottom: space[12] },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    card: { backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: space[4], gap: space[2] },
    button: {
      minHeight: touchTarget,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: space[3],
      paddingHorizontal: space[5],
      borderRadius: radii.pill,
      borderWidth: 1,
    },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2] },
    buttonText: { fontFamily: fonts.bodyMedium, fontSize: 16 },
    chip: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1] + 2,
      paddingHorizontal: space[3] + 2,
      borderRadius: radii.pill,
      borderWidth: 1,
      // 40 visibles + margen táctil: el objetivo efectivo sigue siendo ≥ 44 px por hitSlop del ScrollView.
      marginVertical: 4,
    },
    input: {
      minHeight: touchTarget,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: radii.sm,
      backgroundColor: colors.surface0,
      color: colors.text,
      paddingHorizontal: space[3],
      fontFamily: fonts.body,
      fontSize: 16,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
      minHeight: touchTarget + 4,
      paddingHorizontal: space[4],
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.card,
    },
    searchInput: { flex: 1, minHeight: touchTarget, fontFamily: fonts.body, fontSize: 16 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: touchTarget, paddingVertical: space[2] },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface0,
      borderRadius: radii.sm,
      padding: 3,
      gap: 3,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1],
      minHeight: 42,
      paddingHorizontal: space[3],
      borderRadius: radii.xs + 2,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: space[2],
      paddingVertical: 2,
      borderRadius: radii.xs,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    notice: {
      flexDirection: 'row',
      gap: space[3],
      padding: space[3],
      borderRadius: radii.sm,
      borderWidth: 1,
      backgroundColor: colors.surface0,
      alignItems: 'flex-start',
    },
    loading: { alignItems: 'center', justifyContent: 'center', gap: space[3], paddingVertical: space[10] },
    skeleton: { height: 76, borderRadius: radii.md, backgroundColor: colors.card },
  }),
);
