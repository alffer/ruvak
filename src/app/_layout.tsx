import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { IconButton } from '@/components/Icon';
import { SetupNeeded } from '@/components/SetupNeeded';
import { Loading } from '@/components/ui';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { SessionProvider, useSession } from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, fonts } from '@/lib/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  useEffect(() => {
    if (loaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, fontError]);
  if (!loaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const { scheme, ready } = useTheme();
  // Hasta leer la preferencia guardada no se pinta (evita un parpadeo de tema).
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {isSupabaseConfigured ? (
        <SessionProvider>
          <Navigation />
        </SessionProvider>
      ) : (
        <SetupNeeded />
      )}
    </View>
  );
}

/** Rutas protegidas: sin sesión solo acceso; con sesión sin completar, la bienvenida; después, la app. */
function Navigation() {
  const { ready, session, profile } = useSession();
  if (!ready) return <Loading label="Abriendo RUVAK…" />;
  const signedIn = !!session;
  const onboarded = !!profile?.onboarded;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.heading },
        headerShadowVisible: false,
        // Siempre hay vuelta: si se entra por un enlace directo (sin historial), lleva a Inicio.
        headerLeft: () => (
          <IconButton
            name="back"
            label="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={{ marginLeft: -8, marginRight: 8 }}
          />
        ),
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="entrar" options={{ headerShown: false, title: 'Entrar', headerLeft: undefined }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="recuperar" options={{ title: 'Recuperar acceso' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="bienvenida" options={{ headerShown: false, title: 'Bienvenida' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lugar/[id]" options={{ title: 'Lugar' }} />
        <Stack.Screen name="lugar/nuevo" options={{ title: 'Añadir lugar' }} />
        <Stack.Screen name="lugar/editar/[id]" options={{ title: 'Editar lugar' }} />
        <Stack.Screen name="lista/[id]" options={{ title: 'Lista' }} />
        <Stack.Screen name="importar" options={{ title: 'Importar de Google' }} />
        <Stack.Screen name="agenda" options={{ title: 'Agenda' }} />
        <Stack.Screen name="viajes" options={{ title: 'Viajes' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Editorial' }} />
        <Stack.Screen name="admin/contenido" options={{ title: 'Contenido editorial' }} />
      </Stack.Protected>
      {/* Llega desde el correo de recuperación (con la sesión temporal que crea Supabase). */}
      <Stack.Screen name="nueva-clave" options={{ title: 'Nueva contraseña' }} />
    </Stack>
  );
}
