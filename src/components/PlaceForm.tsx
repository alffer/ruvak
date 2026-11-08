// Formulario de ficha: alta manual, alta desde URL y edición.
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { PlaceInput } from '@/lib/data';
import { useSession } from '@/lib/session';
import { colors, space, typography } from '@/lib/tokens';
import { Chip, Field, Row } from './ui';

export interface PlaceFormValue {
  name: string;
  categoryId: number | null;
  address: string;
  zone: string;
  coords: string;
  website: string;
  phone: string;
  description: string;
}

export const EMPTY_PLACE_FORM: PlaceFormValue = { name: '', categoryId: null, address: '', zone: '', coords: '', website: '', phone: '', description: '' };

/** «43.54, -5.66» → coordenadas; vacío → null; inválido → 'invalid'. */
export function parseCoords(s: string): { lat: number; lng: number } | null | 'invalid' {
  const t = s.trim();
  if (!t) return null;
  const m = /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/.exec(t);
  if (!m) return 'invalid';
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return 'invalid';
  return { lat, lng };
}

export function formToInput(v: PlaceFormValue, cityId: number | null): PlaceInput | string {
  if (!v.name.trim()) return 'El nombre es obligatorio.';
  if (v.categoryId == null) return 'Elige una categoría.';
  const c = parseCoords(v.coords);
  if (c === 'invalid') return 'Las coordenadas deben ser «latitud, longitud», por ejemplo 43.5446, -5.6626.';
  const web = v.website.trim();
  if (web && !/^https?:\/\//i.test(web) && !/^[\w-]+(\.[\w-]+)+/.test(web)) return 'La web no parece una dirección válida.';
  return {
    name: v.name,
    categoryId: v.categoryId,
    address: v.address,
    zone: v.zone,
    lat: c?.lat ?? null,
    lng: c?.lng ?? null,
    website: web && !/^https?:\/\//i.test(web) ? `https://${web}` : web,
    phone: v.phone,
    description: v.description,
    cityId,
  };
}

export function PlaceFields({ value, onChange, showDescription }: { value: PlaceFormValue; onChange: (v: PlaceFormValue) => void; showDescription?: boolean }) {
  const { categories } = useSession();
  const [touched, setTouched] = useState(false);
  const set = (patch: Partial<PlaceFormValue>) => onChange({ ...value, ...patch });
  const coordsState = parseCoords(value.coords);
  return (
    <View style={{ gap: space[4] }}>
      <Field
        label="Nombre"
        value={value.name}
        onChangeText={(name) => set({ name })}
        onBlur={() => setTouched(true)}
        error={touched && !value.name.trim() ? 'El nombre es obligatorio.' : null}
      />
      <View style={{ gap: space[2] }}>
        <Text style={[typography.label, { color: colors.text }]}>Categoría</Text>
        <Row wrap accessibilityLabel="Categoría">
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={value.categoryId === c.id} onPress={() => set({ categoryId: c.id })} />
          ))}
        </Row>
      </View>
      <Field label="Dirección" optional value={value.address} onChangeText={(address) => set({ address })} autoComplete="street-address" />
      <Field label="Zona o barrio" optional value={value.zone} onChangeText={(zone) => set({ zone })} placeholder="Ej.: Cimavilla" />
      <Field
        label="Coordenadas"
        optional
        hint="Para que salga en el mapa: «latitud, longitud». En Google Maps, mantén pulsado el sitio y copia los números."
        value={value.coords}
        onChangeText={(coords) => set({ coords })}
        placeholder="43.5446, -5.6626"
        keyboardType="numbers-and-punctuation"
        error={coordsState === 'invalid' ? 'Formato: latitud, longitud (por ejemplo 43.5446, -5.6626).' : null}
      />
      <Field label="Web" optional value={value.website} onChangeText={(website) => set({ website })} autoCapitalize="none" keyboardType="url" inputMode="url" />
      <Field label="Teléfono" optional value={value.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" inputMode="tel" />
      {showDescription ? <Field label="Descripción" optional multiline value={value.description} onChangeText={(description) => set({ description })} /> : null}
    </View>
  );
}
