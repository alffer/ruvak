import { useState } from 'react';
import { View } from 'react-native';
import { RuvakIllustration } from '@/components/Ruvak';
import { Button, Chip, H1, H2, InlineNotice, P, Row, Screen, ToggleRow } from '@/components/ui';
import { setInterests, updateProfile } from '@/lib/data';
import { useSession } from '@/lib/session';
import { space } from '@/lib/tokens';

/** Primera vez: ciudad habitual (Gijón) y categorías de interés (RF-02). */
export default function Onboarding() {
  const { profile, cities, categories, interests, refreshProfile } = useSession();
  const [cityId, setCityId] = useState<number | null>(profile?.homeCityId ?? cities[0]?.id ?? null);
  const [picked, setPicked] = useState<number[]>(interests);
  const [personalize, setPersonalize] = useState(profile?.personalizationEnabled ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await setInterests(picked);
      await updateProfile({ homeCityId: cityId, personalizationEnabled: personalize, onboarded: true });
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ maxWidth: 640 }}>
      <View style={{ gap: space[3], paddingTop: space[8] }}>
        {/* Gato a pie por tu ciudad, grajo cuando viajes: la idea de RUVAK en una imagen. */}
        <RuvakIllustration pose="transformacion" height={170} maxWidth={600} />
        <H1>Hola{profile?.displayName ? `, ${profile.displayName}` : ''}. Vamos a preparar tu mapa.</H1>
        <P muted>Dos preguntas rápidas. Puedes cambiarlo todo después en Perfil.</P>
      </View>

      <View style={{ gap: space[3] }}>
        <H2>Tu ciudad habitual</H2>
        <Row wrap>
          {cities.map((c) => (
            <Chip key={c.id} label={c.name} selected={cityId === c.id} onPress={() => setCityId(c.id)} icon="pin" />
          ))}
        </Row>
        <P muted style={{ fontSize: 14 }}>
          De momento RUVAK solo cubre Gijón. Las demás ciudades y los viajes llegarán más adelante.
        </P>
      </View>

      <View style={{ gap: space[3] }}>
        <H2>¿Qué te interesa?</H2>
        <P muted style={{ fontSize: 14 }}>
          Lo usamos para ordenar Descubrir. Elige las que quieras.
        </P>
        <Row wrap>
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={picked.includes(c.id)} onPress={() => toggle(c.id)} />
          ))}
        </Row>
        <ToggleRow
          label="Personalizar recomendaciones"
          hint="Solo con lo que eliges aquí y lo que guardas o marcas. Nunca con datos sensibles."
          value={personalize}
          onChange={setPersonalize}
        />
      </View>

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Button title="Empezar" onPress={finish} loading={busy} disabled={!cityId} />
    </Screen>
  );
}
