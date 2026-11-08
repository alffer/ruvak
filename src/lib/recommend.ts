// Orden y razón de las recomendaciones de Descubrir (puro). RF-09/RF-12: solo señales explícitas
// (intereses elegidos, guardados, favoritos, descartes) y una razón solo cuando es clara.
import type { DiscoveryItem, SavedPlace } from './types';

export interface RecommendContext {
  personalizationEnabled: boolean;
  interestIds: number[];
  categoryName: (id: number | null) => string | null;
  saved: SavedPlace[];
}

export function reasonFor(item: DiscoveryItem, ctx: RecommendContext): string | null {
  if (!ctx.personalizationEnabled || !item.place) return null;
  const cat = item.place.categoryId;
  if (cat != null && ctx.interestIds.includes(cat)) {
    const name = ctx.categoryName(cat);
    return name ? `Porque te interesa: ${name.toLowerCase()}` : null;
  }
  const favSameCat = ctx.saved.filter((p) => p.me.favorite && p.categoryId != null && p.categoryId === cat).length;
  if (favSameCat > 0) return `Tienes ${favSameCat === 1 ? 'un favorito' : `${favSameCat} favoritos`} de este tipo`;
  return null;
}

/** Novedades primero; luego, si hay personalización, lo que encaja con los intereses. Estable. */
export function rankDiscovery(items: DiscoveryItem[], ctx: RecommendContext): DiscoveryItem[] {
  const discardedPlaces = new Set(ctx.saved.filter((p) => p.me.status === 'discarded').map((p) => p.id));
  const score = (i: DiscoveryItem) => {
    let s = 0;
    if (i.kind === 'just_opened' || i.kind === 'upcoming_opening' || i.kind === 'announced') s += 4;
    if (ctx.personalizationEnabled && reasonFor(i, ctx)) s += 2;
    if (i.verification === 'outdated' || i.verification === 'closed' || i.verification === 'cancelled') s -= 6;
    return s;
  };
  return items
    .filter((i) => !(i.placeId != null && discardedPlaces.has(i.placeId)))
    .map((item, idx) => ({ item, idx, s: score(item) }))
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .map((x) => x.item);
}
