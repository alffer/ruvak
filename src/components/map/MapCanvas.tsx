// Mapa en móvil: el mismo Leaflet dentro de un WebView (como PdfReader en Sandow). Se comunica
// por postMessage: la app envía marcadores/centro y recibe el marcador tocado.
import { useEffect, useMemo, useRef, type ComponentType, type Ref } from 'react';
import { View } from 'react-native';
import { WebView as RawWebView, type WebViewMessageEvent } from 'react-native-webview';
import type { AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';
import { colors } from '@/lib/tokens';
import { clusterHtml, markerHtml, TILE_ATTRIBUTION, TILE_URL, type MapCanvasProps, type MapMarker } from './mapShared';

const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist';
const CLUSTER = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist';

// Igual que PdfReader en Sandow: los tipos de WebView colapsan a never con esta versión de RN.
type WebViewHandle = { injectJavaScript: (js: string) => void };
const WebView = RawWebView as unknown as ComponentType<AndroidWebViewProps & { ref?: Ref<WebViewHandle> }>;

function html(center: MapCanvasProps['center']) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${LEAFLET}/leaflet.css"><link rel="stylesheet" href="${CLUSTER}/MarkerCluster.css">
<style>html,body,#m{margin:0;height:100%;background:${colors.surface1}}</style></head><body><div id="m"></div>
<script src="${LEAFLET}/leaflet.js"></script><script src="${CLUSTER}/leaflet.markercluster.js"></script>
<script>
const send = (o) => window.ReactNativeWebView.postMessage(JSON.stringify(o));
const map = L.map('m').setView([${center.lat}, ${center.lng}], ${center.zoom});
L.tileLayer(${JSON.stringify(TILE_URL)}, { attribution: ${JSON.stringify(TILE_ATTRIBUTION)}, maxZoom: 19 }).addTo(map);
const group = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 48,
  iconCreateFunction: (c) => L.divIcon({ html: ${JSON.stringify(clusterHtml(0))}.replace('>0<', '>' + c.getChildCount() + '<'), className: '', iconSize: [40, 40] }) });
map.addLayer(group);
map.on('click', () => send({ type: 'select', id: null }));
const icons = ${JSON.stringify({ saved: markerHtml('saved', false), savedSel: markerHtml('saved', true), discovery: markerHtml('discovery', false), discoverySel: markerHtml('discovery', true) })};
window.update = (data) => {
  group.clearLayers();
  for (const m of data.markers) {
    const sel = data.selected && data.selected.id === m.id && data.selected.kind === m.kind;
    const size = sel ? 26 : 20;
    const mk = L.marker([m.lat, m.lng], { icon: L.divIcon({ html: icons[m.kind + (sel ? 'Sel' : '')], className: '', iconSize: [size, size] }), zIndexOffset: sel ? 1000 : 0 });
    mk.on('click', (e) => { L.DomEvent.stopPropagation(e); send({ type: 'select', id: m.id, kind: m.kind }); });
    group.addLayer(mk);
  }
  if (data.center) map.setView([data.center.lat, data.center.lng], data.center.zoom);
  if (data.fit && data.markers.length > 1) map.fitBounds(L.latLngBounds(data.markers.map((m) => [m.lat, m.lng])), { padding: [40, 40], maxZoom: 16 });
};
send({ type: 'ready' });
</script></body></html>`;
}

export default function MapCanvas({ markers, center, selected, onSelect, fitToMarkers }: MapCanvasProps) {
  const web = useRef<WebViewHandle>(null);
  const ready = useRef(false);
  // El HTML solo se genera una vez; los cambios van por update().
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const source = useMemo(() => ({ html: html(center) }), []);

  const push = (withCenter: boolean) => {
    if (!ready.current) return;
    const payload = JSON.stringify({ markers, selected: selected ?? null, fit: fitToMarkers, center: withCenter ? center : null });
    web.current?.injectJavaScript(`window.update(${payload}); true;`);
  };

  useEffect(() => push(false));
  useEffect(() => push(true), [center.lat, center.lng, center.zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMessage = (e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: number | null; kind?: string };
    if (msg.type === 'ready') {
      ready.current = true;
      push(false);
    } else if (msg.type === 'select') {
      onSelect(msg.id == null ? null : (markers.find((m: MapMarker) => m.id === msg.id && m.kind === msg.kind) ?? null));
    }
  };

  return (
    <View style={{ flex: 1, minHeight: 320 }} accessibilityLabel="Mapa">
      <WebView ref={web} originWhitelist={['*']} source={source} onMessage={onMessage} style={{ flex: 1, backgroundColor: colors.surface1 }} />
    </View>
  );
}
