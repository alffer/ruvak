import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PlaceListItem } from '@/components/Place';
import { RuvakEmptyState } from '@/components/Ruvak';
import { Button, Card, confirmAction, ErrorState, Field, InlineNotice, P, Row, Screen, SkeletonList } from '@/components/ui';
import { deleteCollection, getCollections, getMyPlaces, renameCollection } from '@/lib/data';
import { EMPTY_FILTERS, filterPlaces, SMART_LISTS, sortPlaces, type SmartList } from '@/lib/filters';
import { plural } from '@/lib/format';
import { useCategoryName, useSession } from '@/lib/session';
import { space } from '@/lib/tokens';
import { useLoad } from '@/lib/useLoad';

/** Una lista: sugerida (pending/favorites/visited, vista de estados) o personalizada (id numérico). */
export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bump } = useSession();
  const categoryName = useCategoryName();
  const smart = SMART_LISTS.find((s) => s.key === id) ?? null;
  const listId = smart ? null : Number(id);
  const places = useLoad(getMyPlaces, []);
  const lists = useLoad(getCollections, []);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = lists.data?.find((l) => l.id === listId);
  const title = smart?.name ?? list?.name ?? 'Lista';
  const items = sortPlaces(
    filterPlaces(places.data ?? [], { ...EMPTY_FILTERS, smart: (smart?.key as SmartList) ?? null, collectionId: listId }, categoryName),
    'recent',
  );

  async function rename() {
    if (!list || !renaming?.trim()) return;
    try {
      await renameCollection(list.id, renaming);
      setRenaming(null);
      lists.reload();
      bump();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const remove = () =>
    list &&
    confirmAction(`¿Borrar «${list.name}»?`, 'Se borra la lista; los lugares siguen en tu colección.', 'Borrar lista', async () => {
      try {
        await deleteCollection(list.id);
        bump();
        router.back();
      } catch (e) {
        setError((e as Error).message);
      }
    });

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      {places.error ? <ErrorState message={places.error} onRetry={places.reload} /> : null}
      {!smart && lists.data && !list ? <InlineNotice tone="warning">Esta lista ya no existe.</InlineNotice> : null}
      {smart ? <P muted>Se rellena sola con el estado de cada lugar.</P> : null}
      {list ? (
        <Card>
          {renaming !== null ? (
            <>
              <Field label="Nombre de la lista" value={renaming} onChangeText={setRenaming} onSubmitEditing={rename} autoFocus />
              <Row gap={space[2]}>
                <Button title="Guardar" onPress={rename} />
                <Button title="Cancelar" variant="ghost" onPress={() => setRenaming(null)} />
              </Row>
            </>
          ) : (
            <Row gap={space[2]} wrap>
              <P muted style={{ flex: 1 }}>{`${plural(list.count, 'lugar', 'lugares')} · privada`}</P>
              <Button title="Renombrar" icon="pencil" variant="secondary" onPress={() => setRenaming(list.name)} />
              <Button title="Borrar" icon="trash" variant="danger" onPress={remove} />
            </Row>
          )}
        </Card>
      ) : null}
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {places.loading && !places.data ? <SkeletonList /> : null}
      {places.data && !items.length ? (
        <RuvakEmptyState
          title="Esta lista está vacía"
          text={smart ? 'Marca lugares desde su ficha y aparecerán aquí.' : 'Añade lugares a esta lista desde su ficha.'}
          action={{ label: 'Ir a Mis lugares', onPress: () => router.navigate('/lugares') }}
        />
      ) : null}
      <View style={{ gap: space[3] }}>
        {items.map((p) => (
          <PlaceListItem key={p.id} place={p} categoryName={categoryName(p.categoryId)} />
        ))}
      </View>
    </Screen>
  );
}
