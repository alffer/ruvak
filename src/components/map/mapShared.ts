// Tipos y configuración comunes del mapa (web y móvil). El dominio no depende del proveedor:
// cambiar de teselas es cambiar EXPO_PUBLIC_MAP_TILE_URL / ATTRIBUTION (§6 Portabilidad).
import { colors, currentScheme } from '@/lib/tokens';

export type MarkerKind = 'saved' | 'discovery';

export interface MapMarker {
  id: number;
  kind: MarkerKind;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
}

export interface MapCanvasProps {
  markers: MapMarker[];
  center: { lat: number; lng: number; zoom: number };
  selected?: { id: number; kind: MarkerKind } | null;
  onSelect: (m: MapMarker | null) => void;
  /** Encaja la vista en los marcadores cuando cambian los filtros. */
  fitToMarkers?: boolean;
}

/**
 * Teselas por defecto: OpenStreetMap estándar. Su política de uso admite tráfico bajo con atribución;
 * para producción con más tráfico hay que elegir un proveedor con condiciones adecuadas (docs/pendiente.md).
 */
export const TILE_URL = process.env.EXPO_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = process.env.EXPO_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** HTML de un marcador: forma distinta por tipo (no solo color). */
export function markerHtml(kind: MarkerKind, selected: boolean): string {
  // Borde tinta (visible sobre el mapa claro y el oscuro); el seleccionado, más grande y con borde crema.
  const ring = selected ? colors.text : colors.markerEdge;
  const size = selected ? 26 : 20;
  if (kind === 'saved') {
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${colors.markerSaved};border:3px solid ${ring};box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`;
  }
  return `<div style="width:${size}px;height:${size}px;transform:rotate(45deg);background:${colors.markerDiscovery};border:3px solid ${ring};box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`;
}

/** En tema oscuro se oscurecen las teselas con un filtro (no hace falta un proveedor de mapa oscuro). */
export function tileCss(): string {
  return currentScheme() === 'dark' ? '.ruvak-tiles{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9) saturate(.6)}' : '';
}

export function clusterHtml(count: number): string {
  return `<div style="width:40px;height:40px;border-radius:50%;background:${colors.bg};border:2px solid ${colors.text};color:${colors.text};display:flex;align-items:center;justify-content:center;font:600 14px Inter,system-ui,sans-serif">${count}</div>`;
}
