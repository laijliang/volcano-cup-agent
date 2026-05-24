import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { MapView, Marker, AMapSdk } from 'react-native-amap3d';

// 初始化高德 SDK（仅执行一次）
let sdkReady = false;
function initSdk() {
  if (sdkReady || Platform.OS === 'web') return;
  try {
    AMapSdk.init(process.env.EXPO_PUBLIC_AMAP_API_KEY);
    sdkReady = true;
  } catch (_) { /* SDK init may fail in Expo Go */ }
}

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

const ANCHOR_COLORS: Record<string, string> = {
  landmark: '#8B4513',
  food: '#E85D4C',
  secret: '#9370DB',
};

export default function LeafletMapNative({
  anchors,
  selectedAnchorId,
  onSelectAnchor,
  centerLat,
  centerLng,
  style,
}: LeafletMapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initSdk();
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[{ flex: 1, minHeight: 200 }, style]}>
      {ready ? (
        <MapView
          style={StyleSheet.absoluteFill}
          initialCameraPosition={{
            target: { latitude: centerLat, longitude: centerLng },
            zoom: 14,
          }}
          myLocationEnabled
          buildingsEnabled
        >
          {anchors.map((anchor) => {
            const isSelected = selectedAnchorId === anchor.id;
            const color = anchor.checked ? '#3FB950' : ANCHOR_COLORS[anchor.type] || '#8B4513';
            return (
              <Marker
                key={anchor.id}
                position={{ latitude: anchor.latitude, longitude: anchor.longitude }}
                title={anchor.name}
                onPress={() => onSelectAnchor(anchor)}
              />
            );
          })}
        </MapView>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🗺️</Text>
          <Text style={styles.placeholderText}>高德 3D 地图加载中...</Text>
          <Text style={styles.placeholderHint}>请在真机或模拟器中运行以获得完整地图体验</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
