import { router } from 'expo-router';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Screen } from '@/components/ui';

/** Agenda (RF-10, prioridad P1): todavía no hay eventos. Ver docs/pendiente.md. */
export default function Agenda() {
  return (
    <Screen>
      <RuvakEmptyState
        title="La agenda llega pronto"
        text="Aquí verás eventos y planes por fecha, con su fuente y si están en curso, cancelados o ya pasaron. Mientras, mira lo que hay en Descubrir."
        action={{ label: 'Ir a Descubrir', onPress: () => router.navigate('/descubrir') }}
      />
    </Screen>
  );
}
