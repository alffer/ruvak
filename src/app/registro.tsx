import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Button, Field, H1, InlineNotice, P, Screen } from '@/components/ui';
import { authErrorMessage, MIN_PASSWORD, validEmail } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { space } from '@/lib/tokens';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    if (!validEmail(email)) return setError('Escribe un correo válido.');
    if (password.length < MIN_PASSWORD) return setError(`La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`);
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() }, emailRedirectTo: Linking.createURL('/') },
    });
    setBusy(false);
    if (e) return setError(authErrorMessage(e.message));
    // Si el proyecto pide confirmar el correo, no hay sesión todavía.
    if (!data.session) setCheckEmail(true);
  }

  if (checkEmail)
    return (
      <Screen>
        <RuvakEmptyState
          title="Revisa tu correo"
          text={`Te hemos enviado un enlace a ${email.trim()} para confirmar la cuenta. Después, entra con tu contraseña.`}
          action={{ label: 'Ir a entrar', onPress: () => router.replace('/entrar') }}
        />
      </Screen>
    );

  return (
    <Screen contentStyle={{ maxWidth: 440 }}>
      <View style={{ gap: space[2] }}>
        <H1>Crea tu cuenta</H1>
        <P muted>Tus listas y notas son privadas: solo las ves tú.</P>
      </View>
      <View style={{ gap: space[4] }}>
        <Field label="Cómo quieres que te llamemos" optional value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" />
        <Field
          label="Contraseña"
          hint={`Al menos ${MIN_PASSWORD} caracteres.`}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button title="Crear cuenta" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}
