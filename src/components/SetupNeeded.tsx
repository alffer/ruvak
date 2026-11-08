// Pantalla cuando falta .env: explica cómo conectar Supabase en vez de fallar.
import { Text, View } from 'react-native';
import { colors, fonts, radii, space, typography } from '@/lib/tokens';
import { RuvakAvatar } from './Ruvak';
import { H1, P, Screen } from './ui';

export function SetupNeeded() {
  return (
    <Screen>
      <View style={{ gap: space[4], maxWidth: 640 }}>
        <RuvakAvatar size={64} />
        <H1>Falta conectar Supabase</H1>
        <P muted>RUVAK guarda las cuentas y los lugares en Supabase. Para arrancar en local:</P>
        {[
          'Crea un proyecto en supabase.com.',
          'En el editor SQL, ejecuta supabase/migrations/20261107000000_init.sql y después supabase/seed.sql.',
          'Copia .env.example a .env y pon la URL y la clave «anon» (Project Settings › API).',
          'Reinicia con npx expo start.',
        ].map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: space[3] }}>
            <Text style={[typography.bodyStrong, { color: colors.accentText, width: 20 }]}>{i + 1}.</Text>
            <P style={{ flex: 1 }}>{s}</P>
          </View>
        ))}
        <View style={{ backgroundColor: colors.surface0, padding: space[3], borderRadius: radii.sm }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 }}>Más detalle en README.md › «Configurar Supabase».</Text>
        </View>
      </View>
    </Screen>
  );
}
