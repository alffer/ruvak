import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { Button, Card, Chip, confirmAction, Field, H1, H2, InlineNotice, P, Row, Screen, Segmented, ToggleRow } from '@/components/ui';
import { deleteMyAccount, exportMyData, setInterests, updateProfile } from '@/lib/data';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { space } from '@/lib/tokens';

/** Perfil y ajustes: preferencias, importación, privacidad y cuenta (§4). */
export default function ProfileScreen() {
  const { session, profile, cities, categories, interests, refreshProfile } = useSession();
  const { pref, setPref } = useTheme();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [picked, setPicked] = useState<number[]>(interests);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>, ok?: string) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ tone: 'success', text: ok });
    } catch (e) {
      setMsg({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  const savePrefs = () =>
    run(
      'prefs',
      async () => {
        await updateProfile({ displayName: name });
        await setInterests(picked);
        await refreshProfile();
      },
      'Preferencias guardadas.',
    );

  const exportData = () =>
    run('export', async () => {
      const json = await exportMyData();
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        a.download = `ruvak-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else await Share.share({ message: json, title: 'Mis datos de RUVAK' });
      setMsg({ tone: 'success', text: 'Exportación lista.' });
    });

  const deleteAccount = () =>
    confirmAction(
      '¿Borrar tu cuenta?',
      'Se borrarán para siempre tus lugares privados, listas, notas, estados e importaciones. No se puede deshacer.',
      'Borrar cuenta',
      () => run('delete', deleteMyAccount),
    );

  return (
    <Screen contentStyle={{ maxWidth: 720 }}>
      <H1>Perfil</H1>
      <Card>
        <H2>Tu perfil</H2>
        <P muted style={{ fontSize: 14 }}>
          {session?.user.email}
        </P>
        <Field label="Nombre visible" value={name} onChangeText={setName} />
        <P style={{ fontSize: 14 }}>Ciudad habitual: {cities.find((c) => c.id === profile?.homeCityId)?.name ?? 'sin elegir'}</P>
      </Card>

      <Card>
        <H2>Apariencia</H2>
        <P muted style={{ fontSize: 14 }}>
          «Sistema» sigue el ajuste de tu móvil u ordenador.
        </P>
        <Segmented
          label="Tema"
          value={pref}
          onChange={setPref}
          options={[
            { value: 'system', label: 'Sistema' },
            { value: 'dark', label: 'Oscuro' },
            { value: 'light', label: 'Claro' },
          ]}
        />
      </Card>

      <Card>
        <H2>Preferencias</H2>
        <P muted style={{ fontSize: 14 }}>
          Tus intereses ordenan Descubrir aquí y en las ciudades que explores.
        </P>
        <Row wrap>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={picked.includes(c.id)}
              onPress={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
            />
          ))}
        </Row>
        <ToggleRow
          label="Personalizar recomendaciones"
          hint="Usa tus intereses, guardados, favoritos y descartes. Si lo apagas, Descubrir sale sin ordenar por ti."
          value={!!profile?.personalizationEnabled}
          onChange={(v) => run('pers', async () => (await updateProfile({ personalizationEnabled: v }), await refreshProfile()))}
        />
        <Button title="Guardar preferencias" onPress={savePrefs} loading={busy === 'prefs'} style={{ alignSelf: 'flex-start' }} />
      </Card>

      {msg ? <InlineNotice tone={msg.tone}>{msg.text}</InlineNotice> : null}

      <Card>
        <H2>Tus guardados</H2>
        <Row gap={space[2]} wrap>
          <Button title="Importar de Google" icon="upload" variant="secondary" onPress={() => router.push('/importar')} />
        </Row>
      </Card>

      {profile?.role === 'admin' ? (
        <Card>
          <H2>Equipo editorial</H2>
          <P muted style={{ fontSize: 14 }}>
            Publica y revisa lugares, novedades y planes.
          </P>
          <Button title="Abrir panel editorial" icon="pencil" variant="secondary" onPress={() => router.push('/admin')} style={{ alignSelf: 'flex-start' }} />
        </Card>
      ) : null}

      <Card>
        <H2>Privacidad</H2>
        <P muted style={{ fontSize: 14 }}>
          Tus listas, notas y estados son privados: nadie más puede verlos. RUVAK no guarda tu ubicación.
        </P>
        <View style={{ gap: space[2] }}>
          <Button
            title="Exportar mis datos"
            icon="download"
            variant="secondary"
            onPress={exportData}
            loading={busy === 'export'}
            style={{ alignSelf: 'flex-start' }}
          />
          <Button title="Cerrar sesión" icon="logout" variant="secondary" onPress={() => supabase.auth.signOut()} style={{ alignSelf: 'flex-start' }} />
          <Button
            title="Borrar mi cuenta"
            icon="trash"
            variant="danger"
            onPress={deleteAccount}
            loading={busy === 'delete'}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      </Card>
    </Screen>
  );
}
