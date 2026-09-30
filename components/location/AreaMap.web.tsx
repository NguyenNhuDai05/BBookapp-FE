import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { AreaMapProps } from './AreaMap';
const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;
let loader: Promise<void> | undefined;
function loadMaps() {
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    if ((window as any).google?.maps) return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key || '')}&language=vi&region=VN`;
    const timeout = setTimeout(() => { loader = undefined; reject(new Error('Bản đồ tải quá thời gian chờ.')); }, 12000);
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); loader = undefined; reject(new Error('Không tải được bản đồ.')); };
    document.head.appendChild(script);
  });
  return loader;
}
export default function AreaMap({ center, points, onPick, onSelect }: AreaMapProps) {
  const container = useRef<HTMLDivElement>(null); const map = useRef<any>(null);
  const handlers = useRef({ onPick, onSelect }); handlers.current = { onPick, onSelect };
  const initialCenter = useRef(center); const [ready, setReady] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false; let listener: any;
    if (key) loadMaps().then(() => {
      if (disposed || !container.current) return;
      const maps = (window as any).google.maps;
      map.current = new maps.Map(container.current, { center: { lat: initialCenter.current.latitude, lng: initialCenter.current.longitude }, zoom: 12, streetViewControl: false });
      listener = map.current.addListener('click', (event: any) => handlers.current.onPick?.({ latitude: event.latLng.lat(), longitude: event.latLng.lng() })); setReady(true);
    }).catch(e => { if (!disposed) setError(e.message); });
    return () => { disposed = true; listener?.remove(); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const maps = (window as any).google.maps; map.current.setCenter({ lat: center.latitude, lng: center.longitude });
    const overlays = points.flatMap(p => {
      const position = { lat: p.latitude, lng: p.longitude }; const marker = new maps.Marker({ map: map.current, position, title: p.title });
      marker.addListener('click', () => handlers.current.onSelect?.(p.id));
      return p.approximate ? [marker, new maps.Circle({ map: map.current, center: position, radius: 1000, fillColor: '#D82D75', fillOpacity: .08, strokeColor: '#D82D75' })] : [marker];
    });
    return () => overlays.forEach(o => { maps.event.clearInstanceListeners(o); o.setMap(null); });
  }, [ready, center.latitude, center.longitude, points]);
  if (!key || error) return <View style={{ padding: 16 }}><Text>{error || 'Bản đồ web chưa được cấu hình. Bạn vẫn có thể dùng GPS và danh sách MUA.'}</Text></View>;
  return <div ref={container} style={{ width: '100%', height: 300 }} aria-label="Bản đồ khu vực" />;
}
