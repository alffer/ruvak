// Selector de ciudad siempre visible (§4): ciudad activa, si es habitual o explorada, cambiar
// y (próximamente) crear un viaje. Cambiar de ciudad no altera la colección global.
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/lib/session';
import { colors, elevation, iconSize, radii, space, states, touchTarget, typography } from '@/lib/tokens';
import { Icon } from './Icon';
import { Badge, Button, H2, P } from './ui';

export function CitySwitcher() {
  const { activeCity, isHomeCity, cities, setActiveCityId, profile } = useSession();
  const [open, setOpen] = useState(false);
  if (!activeCity) return null;
  const kind = isHomeCity ? 'Habitual' : 'Explorando';
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Ciudad activa: ${activeCity.name}, ${kind}. Cambiar de ciudad`}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? states.pressedOpacity : 1 }]}
      >
        <Icon name="pin" size={iconSize.sm} color={colors.lime} />
        <Text style={[typography.label, { color: colors.text }]}>{activeCity.name}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{kind}</Text>
        <Icon name="chevron-down" size={iconSize.sm} color={colors.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Cerrar" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <H2>Ciudad</H2>
          {cities.map((c) => {
            const sel = c.id === activeCity.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setActiveCityId(c.id);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                style={[styles.option, sel && { borderColor: colors.blueText }]}
              >
                <Icon name={sel ? 'check' : 'pin'} color={sel ? colors.blueText : colors.textSecondary} />
                <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>{c.name}</Text>
                {c.id === profile?.homeCityId ? <Badge label="Habitual" /> : null}
              </Pressable>
            );
          })}
          <P muted style={{ fontSize: 14 }}>
            Añadir ciudades y crear viajes llegará en la próxima fase.
          </P>
          <Button
            title="Ver viajes"
            icon="plane"
            variant="secondary"
            onPress={() => {
              setOpen(false);
              router.push('/viajes');
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1] + 2,
    minHeight: touchTarget - 8,
    paddingHorizontal: space[3],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface0,
    marginHorizontal: space[3],
  },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: space[4],
    gap: space[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.popover,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: touchTarget,
    paddingHorizontal: space[3],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
});
