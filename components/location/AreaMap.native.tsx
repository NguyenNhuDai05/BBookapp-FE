import React, { useEffect, useRef } from 'react';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { AreaMapProps } from './AreaMap';
export default function AreaMap({ center, points, onPick, onSelect }: AreaMapProps) {
  const map = useRef<MapView>(null);
  useEffect(() => { map.current?.animateToRegion({ ...center, latitudeDelta: .08, longitudeDelta: .08 }, 250); }, [center.latitude, center.longitude]);
  return <MapView provider={PROVIDER_GOOGLE} ref={map} style={{ width: '100%', height: 300 }} initialRegion={{ ...center, latitudeDelta: .08, longitudeDelta: .08 }}
    onPress={onPick ? event => onPick(event.nativeEvent.coordinate) : undefined}>
    {points.map(p => <React.Fragment key={p.id}>
      <Marker coordinate={p} title={p.title} pinColor={p.id === 'origin' ? '#3478C8' : '#D82D75'} onPress={() => onSelect?.(p.id)} />
      {p.approximate && <Circle center={p} radius={1000} fillColor="rgba(216,45,117,.08)" strokeColor="#D82D75" />}
    </React.Fragment>)}
  </MapView>;
}
