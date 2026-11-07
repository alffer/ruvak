import { router } from 'expo-router';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Screen } from '@/components/ui';

/** Viajes (RF-11, prioridad P1). RUVAK en forma de grajo: el que conecta ciudades (§11). */
export default function Trips() {
  return (
    <Screen>
      <RuvakEmptyState
        pose="grajo-vuelo"
        title="Una pista para tu próxima escapada"
        text="Pronto podrás crear viajes a otras ciudades, organizar sus lugares y llevarte tus preferencias. Tus guardados de hoy ya están listos para entonces."
        action={{ label: 'Ver mis lugares', onPress: () => router.navigate('/lugares') }}
      />
    </Screen>
  );
}
