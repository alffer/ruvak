import { Tabs } from 'expo-router/js-tabs';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitySwitcher } from '@/components/CitySwitcher';
import { Icon, type IconName } from '@/components/Icon';
import { RuvakAvatar } from '@/components/Ruvak';
import { colors, fonts, layout, typography } from '@/lib/tokens';

/**
 * Navegación principal (§4). Móvil: barra inferior con las secciones prioritarias; Agenda y Viajes
 * se abren desde Inicio y Perfil. Escritorio (≥ 900 px): barra lateral. Icono y texto siempre.
 */
const TABS: { name: string; title: string; short?: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'descubrir', title: 'Descubrir', icon: 'compass' },
  { name: 'mapa', title: 'Mapa', icon: 'map' },
  { name: 'lugares', title: 'Mis lugares', short: 'Lugares', icon: 'bookmark' },
  { name: 'perfil', title: 'Perfil', icon: 'user' },
];

const labelStyle = { ...typography.caption, lineHeight: 18, textAlign: 'center' as const };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= layout.sidebarBreakpoint;
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarVariant: wide ? 'material' : 'uikit',
        tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.heading },
        headerShadowVisible: false,
        headerRight: () => <CitySwitcher />,
        // Marca en cada pestaña: la cabeza de RUVAK junto al título.
        headerLeft: () => (
          <View style={{ marginLeft: 12 }}>
            <RuvakAvatar size={34} />
          </View>
        ),
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.blueText,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor: wide ? colors.surface3 : undefined,
        tabBarStyle: wide
          ? { backgroundColor: colors.surface0, borderRightColor: colors.border, width: layout.sidebarWidth, paddingTop: 16 }
          : { backgroundColor: colors.surface0, borderTopColor: colors.border, height: 68 + insets.bottom, paddingTop: 8, paddingBottom: 8 + insets.bottom },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarLabel: ({ color }) => (
              <Text numberOfLines={1} style={[labelStyle, { color: String(color) }, wide && { fontSize: 15, textAlign: 'left', marginLeft: 12 }]}>
                {wide ? t.title : (t.short ?? t.title)}
              </Text>
            ),
            tabBarAccessibilityLabel: t.title,
            tabBarIcon: ({ color }) => <Icon name={t.icon} color={String(color)} size={22} />,
          }}
        />
      ))}
    </Tabs>
  );
}
