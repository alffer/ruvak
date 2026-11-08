import { router, Stack } from 'expo-router';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Screen } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <RuvakEmptyState
        title="Este rincón no existe"
        text="La dirección no lleva a ninguna parte."
        action={{ label: 'Volver a Inicio', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
