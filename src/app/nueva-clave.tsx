import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, H1, InlineNotice, P, Screen } from '@/components/ui';
import { authErrorMessage, MIN_PASSWORD } from '@/lib/authErrors';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { space } from '@/lib/tokens';

export default function NewPassword() {
  const { session } = useSession();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (password.length < MIN_PASSWORD) return setError(`La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`);
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) setError(authErrorMessage(e.message));
    else setDone(true);
  }

  if (!session)
    return (
      <Screen contentStyle={{ maxWidth: 440 }}>
        <H1>Enlace caducado</H1>
        <InlineNotice tone="warning">Este enlace ya no es válido. Pide uno nuevo desde «He olvidado la contraseña».</InlineNotice>
        <Button title="Pedir otro enlace" onPress={() => router.replace('/recuperar')} />
      </Screen>
    );

  return (
    <Screen contentStyle={{ maxWidth: 440 }}>
      <View style={{ gap: space[2] }}>
        <H1>Nueva contraseña</H1>
        <P muted>Elige una contraseña nueva para tu cuenta.</P>
      </View>
      {done ? (
        <>
          <InlineNotice tone="success">Contraseña cambiada.</InlineNotice>
          <Button title="Ir a Inicio" onPress={() => router.replace('/')} />
        </>
      ) : (
        <View style={{ gap: space[4] }}>
          <Field
            label="Nueva contraseña"
            hint={`Al menos ${MIN_PASSWORD} caracteres.`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            onSubmitEditing={submit}
          />
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          <Button title="Guardar contraseña" onPress={submit} loading={busy} />
        </View>
      )}
    </Screen>
  );
}
