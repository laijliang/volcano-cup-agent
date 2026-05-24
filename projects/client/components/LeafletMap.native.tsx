import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, type ViewStyle } from 'react-native';
import { MapView, Marker, AMapSdk } from 'react-native-amap3d';

// 初始化高德 SDK（仅执行一次）
let sdkReady = false;
let sdkInitAttempted = false;
function initSdk(): boolean {
  if (sdkInitAttempted || Platform.OS === 'web') return sdkReady;
  sdkInitAttempted = true;
  try {
    AMapSdk.init(process.env.EXPO_PUBLIC_AMAP_API_KEY);
    sdkReady = true;
    return true;
  } catch (_) {
    return false;
  }
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

const TYPE_COLORS: Record<string, string> = {
  landmark: '#8B4513',
  food: '#E85D4C',
  secret: '#9370DB',
};

const TYPE_LABELS: Record<string, string> = {
  landmark: '地标',
  food: '美食',
  secret: '秘境',
};

export default function LeafletMapNative({
  anchors,
  selectedAnchorId,
  onSelectAnchor,
  centerLat,
  centerLng,
  style,
}: LeafletMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [sdkOk, setSdkOk] = useState(false);

  useEffect(() => {
    const ok = initSdk();
    setSdkOk(ok);
    // 如果 SDK 初始化失败，3 秒后自动切到列表视图
    if (!ok) {
      const timer = setTimeout(() => setShowMap(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const visibleAnchors = anchors.filter(a => a.unlocked);

  return (
    <View style={[{ flex: 1, minHeight: 200 }, style]}>
      {showMap && sdkOk ? (
        <View style={{ flex: 1 }}>
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
              const color = anchor.checked ? '#3FB950' : TYPE_COLORS[anchor.type] || '#8B4513';
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
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowMap(false)}>
            <Text style={styles.toggleBtnText}>列表</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>附近锚点</Text>
              <Text style={styles.listSubtitle}>{visibleAnchors.length} 个可探索地点</Text>
            </View>
            {visibleAnchors.map((anchor) => {
              const isSelected = selectedAnchorId === anchor.id;
              const color = anchor.checked ? '#3FB950' : TYPE_COLORS[anchor.type] || '#8B4513';
              return (
                <TouchableOpacity
                  key={anchor.id}
                  style={[styles.anchorCard, isSelected && { borderColor: color, borderWidth: 2 }]}
                  onPress={() => onSelectAnchor(anchor)}
                >
                  <View style={styles.anchorLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.typeBadgeText, { color }]}>
                        {TYPE_LABELS[anchor.type] || '地标'}
                      </Text>
                    </View>
                    <Text style={[styles.anchorName, anchor.checked && styles.anchorChecked]}>
                      {anchor.checked ? '✓ ' : ''}{anchor.name}
                    </Text>
                  </View>
                  <Text style={styles.anchorDesc} numberOfLines={1}>
                    {anchor.description || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {sdkOk && (
            <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowMap(true)}>
              <Text style={styles.toggleBtnText}>地图</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  anchorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  anchorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  anchorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  anchorChecked: {
    color: '#3FB950',
  },
  anchorDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  toggleBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
