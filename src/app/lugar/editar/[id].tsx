import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { formToInput, PlaceFields, type PlaceFormValue } from '@/components/PlaceForm';
import { Button, Card, ErrorState, InlineNotice, Loading, Screen } from '@/components/ui';
import { getPlace, updatePlace } from '@/lib/data';
import { useSession } from '@/lib/session';
import type { Place } from '@/lib/types';
import { useLoad } from '@/lib/useLoad';

function toForm(p: Place): PlaceFormValue {
  return {
    name: p.name,
    categoryId: p.categoryId,
    address: p.address ?? '',
    zone: p.zone ?? '',
    coords: p.lat != null ? `${p.lat}, ${p.lng}` : '',
    website: p.website ?? '',
    phone: p.phone ?? '',
    description: p.description ?? '',
  };
}

export default function EditPlace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const detail = useLoad(() => getPlace(Number(id)), [id]);
  const p = detail.data?.place;

  if (detail.error)
    return (
      <Screen>
        <ErrorState message={detail.error} onRetry={detail.reload} />
      </Screen>
    );
  if (!p) return <Loading />;
  // RLS lo impide de todas formas; aquí solo se evita mostrar un formulario inútil.
  if (p.isEditorial && profile?.role !== 'admin')
    return (
      <Screen>
        <InlineNotice tone="warning">Esta ficha es de RUVAK y solo la edita el equipo editorial. Tu nota y tu estado se cambian desde la ficha.</InlineNotice>
      </Screen>
    );
  // key: el formulario arranca con los datos cargados (sin copiar estado en un efecto).
  return <EditForm key={`${p.id}:${p.updatedAt}`} place={p} />;
}

function EditForm({ place }: { place: Place }) {
  const { bump } = useSession();
  const [form, setForm] = useState<PlaceFormValue>(() => toForm(place));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const input = formToInput(form, place.cityId);
    if (typeof input === 'string') return setError(input);
    setBusy(true);
    try {
      await updatePlace(place.id, input);
      bump();
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ maxWidth: 720 }}>
      <Card>
        <PlaceFields value={form} onChange={setForm} showDescription />
      </Card>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Button title="Guardar cambios" onPress={save} loading={busy} />
    </Screen>
  );
}
