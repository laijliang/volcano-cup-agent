// TypeScript types for LeafletMap component.
// Metro resolves to LeafletMap.web.tsx (web) or LeafletMap.native.tsx (native) at build time.

import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

interface Anchor {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'landmark' | 'food' | 'secret';
  checked: boolean;
  region_id: string;
  unlocked: boolean;
  description?: string;
}

export interface LeafletMapProps {
  anchors: Anchor[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchor: Anchor) => void;
  centerLat: number;
  centerLng: number;
  style?: ViewStyle;
}

export default function LeafletMap(_props: LeafletMapProps) {
  return null;
}
