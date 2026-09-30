import React from 'react';
import { Text, View } from 'react-native';
import type { Coordinate } from '../../types/location';
export interface MapPoint extends Coordinate { id: string; title: string; approximate?: boolean }
export interface AreaMapProps { center: Coordinate; points: MapPoint[]; onPick?: (point: Coordinate) => void; onSelect?: (id: string) => void }
export default function AreaMap(_props: AreaMapProps) { return <View><Text>Bản đồ có trên Android, iOS và web.</Text></View>; }
