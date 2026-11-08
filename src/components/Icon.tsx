import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Ban,
  Bird,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Coffee,
  Compass,
  Download,
  ExternalLink,
  EyeOff,
  Globe,
  Heart,
  House,
  Info,
  LayoutGrid,
  Link,
  List,
  LogOut,
  Map,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Upload,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, iconSize, radii, states, touchTarget } from '@/lib/tokens';

/**
 * Iconos funcionales lineales (Lucide): un mismo trazo y tamaño. Solo se importan los que usa la app;
 * se añaden aquí. No se mezclan con ilustraciones de RUVAK en el mismo nivel (§10 Iconografía).
 */
const ICONS = {
  archive: Archive,
  back: ArrowLeft,
  'arrow-right': ArrowRight,
  book: BookOpen,
  coffee: Coffee,
  ticket: Ticket,
  utensils: UtensilsCrossed,
  ban: Ban,
  bird: Bird,
  bookmark: Bookmark,
  'bookmark-check': BookmarkCheck,
  calendar: Calendar,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  alert: CircleAlert,
  'check-circle': CircleCheck,
  pending: CircleDashed,
  compass: Compass,
  download: Download,
  external: ExternalLink,
  hide: EyeOff,
  globe: Globe,
  heart: Heart,
  home: House,
  info: Info,
  grid: LayoutGrid,
  link: Link,
  list: List,
  logout: LogOut,
  map: Map,
  pin: MapPin,
  navigation: Navigation,
  pencil: Pencil,
  phone: Phone,
  plane: Plane,
  plus: Plus,
  refresh: RefreshCw,
  search: Search,
  shield: Shield,
  filters: SlidersHorizontal,
  sparkles: Sparkles,
  tag: Tag,
  trash: Trash2,
  upload: Upload,
  user: User,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Decorativo: oculto a lectores de pantalla (el texto o la etiqueta del botón lleva el significado). */
const HIDDEN = Platform.OS === 'web' ? { 'aria-hidden': true } : { accessible: false, importantForAccessibility: 'no-hide-descendants' as const };

export function Icon({ name, size = iconSize.md, color = colors.text, fill }: { name: IconName; size?: number; color?: string; fill?: string }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} color={color} strokeWidth={2} absoluteStrokeWidth fill={fill ?? 'none'} {...HIDDEN} />;
}

/** Botón solo con icono: siempre con etiqueta accesible y objetivo de 48 px. */
export function IconButton({
  name,
  label,
  onPress,
  color = colors.text,
  fill,
  pressed: isPressed,
  style,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  fill?: string;
  /** Para botones de alternar (favorito): estado anunciado. */
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isPressed === undefined ? undefined : { selected: isPressed }}
      aria-pressed={isPressed}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? states.pressedOpacity : 1 }, style]}
    >
      <Icon name={name} color={color} fill={fill} size={iconSize.lg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
});
