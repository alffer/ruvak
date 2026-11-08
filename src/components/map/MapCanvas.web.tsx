// Mapa en web: Leaflet + markercluster directamente sobre el DOM.
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import { clusterHtml, markerHtml, TILE_ATTRIBUTION, TILE_URL, tileCss, type MapCanvasProps } from './mapShared';

export default function MapCanvas({ markers, center, selected, onSelect, fitToMarkers }: MapCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.MarkerClusterGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = host.current!;
    const m = L.map(el, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], center.zoom);
    const css = document.createElement('style');
    css.textContent = tileCss();
    document.head.appendChild(css);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, className: 'ruvak-tiles' }).addTo(m);
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      iconCreateFunction: (c) => L.divIcon({ html: clusterHtml(c.getChildCount()), className: '', iconSize: [40, 40] }),
    });
    m.addLayer(group);
    m.on('click', () => onSelectRef.current(null));
    map.current = m;
    layer.current = group;
    return () => {
      css.remove();
      m.remove();
      map.current = null;
    };
    // Solo al montar: el centro cambia con setView más abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setView([center.lat, center.lng], center.zoom);
  }, [center.lat, center.lng, center.zoom]);

  useEffect(() => {
    const group = layer.current;
    if (!group || !map.current) return;
    group.clearLayers();
    for (const mk of markers) {
      const isSel = selected?.id === mk.id && selected.kind === mk.kind;
      const size = isSel ? 26 : 20;
      const marker = L.marker([mk.lat, mk.lng], {
        icon: L.divIcon({ html: markerHtml(mk.kind, isSel), className: '', iconSize: [size, size] }),
        title: mk.title,
        alt: `${mk.title}${mk.kind === 'discovery' ? ' (recomendación)' : ' (guardado)'}`,
        keyboard: true,
        zIndexOffset: isSel ? 1000 : 0,
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(mk);
      });
      marker.on('keypress', (e) => {
        const key = (e as L.LeafletKeyboardEvent).originalEvent.key;
        if (key === 'Enter' || key === ' ') onSelectRef.current(mk);
      });
      group.addLayer(marker);
    }
    if (fitToMarkers && markers.length > 1) map.current.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40], maxZoom: 16 });
  }, [markers, selected, fitToMarkers]);

  return <div ref={host} style={{ flex: 1, minHeight: 320, height: '100%', width: '100%' }} aria-label="Mapa" role="region" />;
}
