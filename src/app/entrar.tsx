import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { RuvakAvatar } from '@/components/Ruvak';
import { Button, Field, InlineNotice, LinkButton, Overline, P, Screen } from '@/components/ui';
import { authErrorMessage, validEmail } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/tokens';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!validEmail(email) || !password) return setError('Escribe tu correo y tu contraseña.');
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (e) setError(authErrorMessage(e.message));
    // Con sesión, las rutas protegidas llevan solas a Inicio o a la bienvenida.
  }

  return (
    <Screen contentStyle={{ maxWidth: 440, justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ gap: space[3], paddingTop: space[10] }}>
        <RuvakAvatar size={72} />
        <Text style={{ fontFamily: fonts.heading, fontSize: 44, color: colors.text, letterSpacing: 2 }} accessibilityRole="header">
          RUVAK
        </Text>
        <Overline color={colors.lime}>Gijón · tu mapa personal</Overline>
        <P muted>Reúne los sitios que guardas en mil sitios y descubre lo nuevo de tu ciudad.</P>
      </View>
      <View style={{ gap: space[4] }}>
        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
          textContentType="emailAddress"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button title="Entrar" onPress={submit} loading={busy} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space[2] }}>
          <LinkButton label="Crear cuenta" onPress={() => router.push('/registro')} />
          <LinkButton label="He olvidado la contraseña" onPress={() => router.push('/recuperar')} />
        </View>
      </View>
    </Screen>
  );
}
