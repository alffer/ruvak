// Tipos de dominio. Se corresponden con el esquema de supabase/migrations (ver docs/datos.md).

export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  displayName: string;
  homeCityId: number | null;
  role: Role;
  personalizationEnabled: boolean;
  onboarded: boolean;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  countryCode: string;
  region: string | null;
  centerLat: number;
  centerLng: number;
  zoom: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

/** Estado personal de visita (vive en user_places, nunca en la ficha pública). */
export type VisitStatus = 'pending' | 'visited' | 'discarded';

export type SourceType = 'manual' | 'url' | 'google_maps' | 'instagram' | 'tiktok' | 'google_takeout' | 'editorial' | 'other';

export interface PlaceSource {
  id: number;
  sourceType: SourceType;
  url: string | null;
  externalId: string | null;
  label: string | null;
  checkedAt: string | null;
  createdAt: string;
  mine: boolean;
}

export interface UserPlace {
  status: VisitStatus | null;
  favorite: boolean;
  note: string;
  tags: string[];
  savedAt: string;
  visitedAt: string | null;
}

export interface Place {
  id: number;
  name: string;
  nameKey: string;
  description: string | null;
  categoryId: number | null;
  address: string | null;
  zone: string | null;
  cityId: number | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  imageCredit: string | null;
  /** Ficha pública del equipo editorial (owner_id NULL). */
  isEditorial: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lugar de la colección personal: ficha + relación personal + listas. */
export interface SavedPlace extends Place {
  me: UserPlace;
  collectionIds: number[];
}

export interface Collection {
  id: number;
  name: string;
  count: number;
  createdAt: string;
}

/** Estados editoriales (documento §8). La UI los traduce con VERIFICATION_LABELS. */
export type Verification = 'confirmed' | 'announced' | 'unverified' | 'outdated' | 'closed' | 'cancelled';

/** Tipos de contenido de Descubrir (RF-09). */
export type DiscoveryKind = 'just_opened' | 'upcoming_opening' | 'announced' | 'recommended' | 'featured' | 'plan';

export interface DiscoveryItem {
  id: number;
  cityId: number;
  placeId: number | null;
  place: Place | null;
  kind: DiscoveryKind;
  title: string;
  summary: string;
  imageUrl: string | null;
  imageCredit: string | null;
  verification: Verification;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedAt: string | null;
  /** Fechas de un evento temporal (exposición, concierto…). Un plan sin fecha de fin no se muestra. */
  startsOn: string | null;
  endsOn: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  pending: 'Pendiente',
  visited: 'Visitado',
  discarded: 'Descartado',
};

export const VERIFICATION_LABELS: Record<Verification, string> = {
  confirmed: 'Confirmado',
  announced: 'Anunciado',
  unverified: 'Sin verificar',
  outdated: 'Información antigua',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
};

export const DISCOVERY_KIND_LABELS: Record<DiscoveryKind, string> = {
  just_opened: 'Recién abierto',
  upcoming_opening: 'Próxima apertura',
  announced: 'Anunciado',
  recommended: 'Recomendado',
  featured: 'Destacado',
  plan: 'Plan',
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  manual: 'Alta manual',
  url: 'Enlace',
  google_maps: 'Google Maps',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google_takeout: 'Google Takeout',
  editorial: 'Equipo editorial',
  other: 'Otra fuente',
};
