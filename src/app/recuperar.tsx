import * as Linking from 'expo-linking';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, H1, InlineNotice, P, Screen } from '@/components/ui';
import { authErrorMessage, validEmail } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { space } from '@/lib/tokens';

export default function Recover() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!validEmail(email)) return setError('Escribe un correo válido.');
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('/nueva-clave') });
    setBusy(false);
    if (e) setError(authErrorMessage(e.message));
    else setSent(true);
  }

  return (
    <Screen contentStyle={{ maxWidth: 440 }}>
      <View style={{ gap: space[2] }}>
        <H1>Recuperar acceso</H1>
        <P muted>Te enviaremos un enlace para elegir una contraseña nueva.</P>
      </View>
      {sent ? (
        // Mismo mensaje exista o no la cuenta: no revela qué correos están registrados.
        <InlineNotice tone="success">
          Si hay una cuenta con {email.trim()}, recibirás el enlace en unos minutos. Revisa también el correo no deseado.
        </InlineNotice>
      ) : (
        <View style={{ gap: space[4] }}>
          <Field
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            onSubmitEditing={submit}
          />
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          <Button title="Enviar enlace" onPress={submit} loading={busy} />
        </View>
      )}
    </Screen>
  );
}
