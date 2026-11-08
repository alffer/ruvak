import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitySwitcher } from '@/components/CitySwitcher';
import { Icon, IconButton, type IconName } from '@/components/Icon';
import { RuvakWordmark } from '@/components/Ruvak';
import { colors, currentScheme, layout, space, states, themed, typography } from '@/lib/tokens';

/**
 * Navegación principal (lámina «Navegación inferior»): Inicio, Explorar, «+» (añadir lugar), Guardados y Mapa.
 * El perfil está en la cabecera. En escritorio (≥ 900 px) pasa a barra lateral y el perfil entra en ella.
 * Icono y texto siempre.
 */
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'descubrir', title: 'Explorar', icon: 'compass' },
  { name: 'lugares', title: 'Guardados', icon: 'bookmark' },
  { name: 'mapa', title: 'Mapa', icon: 'map' },
];

// Navegación: Inter Medium (lámina).
const labelStyle = { ...typography.micro, textAlign: 'center' as const };

function AddButton({ wide }: { wide: boolean }) {
  return (
    <View style={wide ? styles.addWide : styles.addSlot}>
      <Pressable
        onPress={() => router.push('/lugar/nuevo')}
        accessibilityRole="button"
        accessibilityLabel="Añadir lugar"
        style={({ pressed }) => [
          styles.add,
          wide && { flexDirection: 'row', width: 'auto', paddingHorizontal: space[5], gap: space[2] },
          { opacity: pressed ? states.pressedOpacity : 1 },
        ]}
      >
        <Icon name="plus" size={wide ? 20 : 26} color={colors.onPrimary} />
        {wide ? <Text style={[typography.label, { color: colors.onPrimary }]}>Añadir lugar</Text> : null}
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= layout.sidebarBreakpoint;
  const tab = (t: (typeof TABS)[number]) => (
    <Tabs.Screen
      key={t.name}
      name={t.name}
      options={{
        title: t.title,
        tabBarLabel: ({ color }) => (
          <Text numberOfLines={1} style={[labelStyle, { color: String(color) }, wide && { fontSize: 15, textAlign: 'left', marginLeft: 12 }]}>
            {t.title}
          </Text>
        ),
        tabBarAccessibilityLabel: t.title,
        tabBarIcon: ({ color }) => <Icon name={t.icon} color={String(color)} size={22} />,
      }}
    />
  );
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarVariant: wide ? 'material' : 'uikit',
        tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        // Cabecera de la lámina: «ruvak_» a la izquierda; ciudad y perfil a la derecha. El título lo pone cada pantalla.
        headerTitle: '',
        headerLeft: () => (
          <View style={{ marginLeft: space[4] }}>
            <RuvakWordmark size={30} />
          </View>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: space[2] }}>
            <CitySwitcher />
            <IconButton name="user" label="Perfil y ajustes" onPress={() => router.navigate('/perfil')} />
          </View>
        ),
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor: wide ? colors.raised : undefined,
        tabBarStyle: wide
          ? { backgroundColor: colors.surface0, borderRightColor: colors.border, width: layout.sidebarWidth, paddingTop: 16 }
          : { backgroundColor: colors.surface0, borderTopColor: colors.border, height: 74 + insets.bottom, paddingTop: 8, paddingBottom: 12 + insets.bottom },
      }}
    >
      {tab(TABS[0])}
      {tab(TABS[1])}
      <Tabs.Screen name="nuevo" options={{ title: 'Añadir lugar', tabBarButton: () => <AddButton wide={wide} /> }} />
      {tab(TABS[2])}
      {tab(TABS[3])}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          // Móvil: acceso desde la cabecera, sin hueco en la barra. NO usar `href: null`: en esta versión de
          // Expo Router oculta la pestaña y navegar a ella redirige a Inicio. Escritorio: también en la barra lateral.
          ...(wide ? {} : { tabBarItemStyle: { display: 'none' as const } }),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} style={[labelStyle, { color: String(color) }, { fontSize: 15, textAlign: 'left', marginLeft: 12 }]}>
              Perfil
            </Text>
          ),
          tabBarIcon: ({ color }) => <Icon name="user" color={String(color)} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    addSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    addWide: { paddingHorizontal: space[3], paddingVertical: space[2] },
    add: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
      // En claro el lima sobre crema no llega a 3:1 como forma: borde tinta.
      borderWidth: currentScheme() === 'light' ? 2 : 0,
      borderColor: colors.onPrimary,
    },
  }),
);
