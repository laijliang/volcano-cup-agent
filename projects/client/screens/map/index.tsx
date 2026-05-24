import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getRegions, getAnchors, createCheckin, getStats } from '@/services/api';
import { Spinner, Dialog, Skeleton, useToast } from '@/heroui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import LeafletMap from '@/components/LeafletMap';
import NpcChatDialog from '@/components/NpcChatDialog';

const isWeb = Platform.OS === 'web';

const { width } = Dimensions.get('window');

interface Region {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  icon: string;
  unlocked: boolean;
}

interface Anchor {
  id: string;
  name: string;
  region_id: string;
  latitude: number;
  longitude: number;
  type: 'landmark' | 'food' | 'secret';
  unlocked: boolean;
  checked: boolean;
  description?: string;
}

interface Stats {
  checked_anchors: number;
  total_anchors: number;
}

// 获取锚点图标
const getAnchorIcon = (type: string) => {
  switch (type) {
    case 'landmark':
      return 'camera';
    case 'food':
      return 'utensils';
    case 'secret':
      return 'star';
    default:
      return 'map-marker';
  }
};

// 区域专属色映射
const REGION_COLORS: Record<string, string> = {
  yuexiu: '#8B4513',
  liwan: '#DAA520',
  haizhu: '#4682B4',
  tianhe: '#9370DB',
  panyu: '#228B22',
  baiyun: '#87CEEB',
  huangpu: '#CD853F',
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const t = useAppTheme();
  const params = useSafeSearchParams<{ region?: string }>();
  const [regions, setRegions] = useState<Region[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeRegion, setActiveRegion] = useState(params.region || 'yuexiu');
  const [selectedAnchor, setSelectedAnchor] = useState<Anchor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 打卡相关状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // NPC 对话状态
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setRefreshing(true);
      const [regionsData, anchorsData, statsData] = await Promise.all([
        getRegions(),
        getAnchors(),
        getStats(),
      ]);
      setRegions(regionsData);
      setAnchors(anchorsData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (!isRefresh) {
        setLoadError(error?.message || '加载失败');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const currentRegion = regions.find(r => r.id === activeRegion);
  const regionAnchors = anchors.filter(a => a.region_id === activeRegion);

  const handleSelectFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show({ label: '需要相册权限', description: '请在设置中允许相册权限才能选择照片哦～', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setCheckinModalVisible(true);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!selectedImage || !selectedAnchor) return;
    setIsCheckingIn(true);
    try {
      // 获取当前 GPS 坐标用于打卡验证
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
      } catch (_) { /* GPS unavailable, backend will skip distance check */ }

      await createCheckin(selectedAnchor.id, selectedImage, currentRegion?.name || '', coords);
      setAnchors(prev => prev.map(a =>
        a.id === selectedAnchor.id ? { ...a, checked: true } : a
      ));
      toast.show({ label: '打卡成功！', description: `恭喜你完成了「${selectedAnchor.name}」的打卡！`, variant: 'success' });
      setCheckinModalVisible(false);
      setSelectedImage(null);
      setSelectedAnchor(null);
      loadData();
    } catch (error) {
      toast.show({ label: '打卡失败', description: '请稍后重试', variant: 'danger' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: t.bg,
  },
  // 地图全屏布局
  mapFullscreen: {
    flex: 1,
    minHeight: 200,
  },
  mapWrapper: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  // 底部浮动面板
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: t.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '50%',
  },
  bottomPanelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: t.textSecondary,
  },
  // 顶部区域
  header: {
    backgroundColor: t.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: t.text,
  },
  headerGlow: {
    height: 4,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.primary,
  },
  regionScroll: {
    flexGrow: 0,
    height: 40,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  regionChipLocked: {
    opacity: 0.5,
  },
  regionChipText: {
    fontSize: 14,
    color: t.textSecondary,
  },
  regionChipTextActive: {
    color: t.textInverse,
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: 4,
  },
  // 地图占位区域
  mapPlaceholder: {
    height: 220,
    margin: 16,
    backgroundColor: t.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mapPlaceholderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPlaceholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: t.text,
  },
  mapPlaceholderHint: {
    fontSize: 13,
    color: t.textTertiary,
  },
  // 锚点列表
  anchorListContainer: {
    backgroundColor: t.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    minHeight: 80,
  },
  anchorListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  anchorListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: t.text,
  },
  anchorScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  anchorCard: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: t.surfaceTertiary,
    borderRadius: 14,
    marginHorizontal: 4,
    position: 'relative',
  },
  anchorCardActive: {
    backgroundColor: t.info + '20',
    borderWidth: 2,
    borderColor: t.info,
  },
  anchorCardChecked: {
    backgroundColor: t.primaryBg,
  },
  anchorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  anchorName: {
    fontSize: 13,
    color: t.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkedMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: t.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 选中锚点详情
  anchorDetail: {
    padding: 16,
    backgroundColor: t.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  anchorDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  anchorDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchorDetailInfo: {
    flex: 1,
  },
  anchorDetailName: {
    fontSize: 18,
    fontWeight: '700',
    color: t.text,
    marginBottom: 2,
  },
  anchorDetailCoords: {
    fontSize: 12,
    color: t.textTertiary,
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  checkedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  checkedText: {
    fontSize: 12,
    fontWeight: '600',
    color: t.primary,
    marginLeft: 4,
  },
  anchorDetailDesc: {
    fontSize: 14,
    color: t.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  anchorDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  checkinBtnGradient: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkinBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  checkinBtnText: {
    color: t.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  npcChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  npcChatEmoji: {
    fontSize: 16,
  },
  npcChatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: t.borderLight,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: t.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: t.info,
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: t.textInverse,
  },
  }), [t]);

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <View style={{ flex: 1 }}>
          <View style={[styles.header, { paddingTop: 10 }]}>
            <Skeleton variant="shimmer" style={{ width: 120, height: 24, borderRadius: 6, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="shimmer" style={{ width: 70, height: 36, borderRadius: 20 }} />
              ))}
            </View>
          </View>

          <Skeleton variant="shimmer" style={{ flex: 1, minHeight: 200 }} />

          <View style={styles.bottomPanel}>
            <View style={styles.bottomPanelHandle} />
            <Skeleton variant="shimmer" style={{ width: 120, height: 15, borderRadius: 4, marginLeft: 16, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="shimmer" style={{ width: 88, height: 80, borderRadius: 14 }} />
              ))}
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen style={styles.loadingContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <FontAwesome6 name="triangle-exclamation" size={48} color={t.textTertiary} />
          <Text style={{ fontSize: 16, color: t.textSecondary, marginTop: 16, textAlign: 'center' }}>{loadError}</Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: t.primary, borderRadius: 24 }}
            onPress={() => { setLoadError(null); loadData(); }}
          >
            <Text style={{ color: t.textInverse, fontWeight: '600' }}>重试</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* 顶部区域 — 紧凑型 */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>探索地图</Text>
            {stats && (
              <View style={styles.statsBadge}>
                <FontAwesome6 name="check-circle" size={12} color={t.primary} />
                <Text style={styles.statsText}>{stats.checked_anchors}/{stats.total_anchors}</Text>
              </View>
            )}
          </View>

          {/* 区域选择 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.regionScroll}
          >
            {regions.map(region => (
              <TouchableOpacity
                key={region.id}
                style={[
                  styles.regionChip,
                  activeRegion === region.id && { backgroundColor: (REGION_COLORS[region.id] || t.info) },
                  !region.unlocked && styles.regionChipLocked,
                ]}
                onPress={() => region.unlocked && setActiveRegion(region.id)}
              >
                <FontAwesome6
                  name={region.icon as any}
                  size={14}
                  color={activeRegion === region.id ? t.textInverse : t.textSecondary}
                />
                <Text style={[
                  styles.regionChipText,
                  activeRegion === region.id && styles.regionChipTextActive,
                ]}>
                  {region.name}
                </Text>
                {!region.unlocked && (
                  <FontAwesome6 name="lock" size={10} color={t.textTertiary} style={styles.lockIcon} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 地图 — 填充全部剩余空间 */}
        <View style={styles.mapWrapper}>
          {isWeb ? (
            <LeafletMap
              anchors={regionAnchors}
              selectedAnchorId={selectedAnchor?.id || null}
              onSelectAnchor={setSelectedAnchor}
              centerLat={regionAnchors[0]?.latitude || 23.1291}
              centerLng={regionAnchors[0]?.longitude || 113.2644}
            />
          ) : (
            <View style={[styles.mapPlaceholder, { flex: 1, margin: 0, borderRadius: 0, borderWidth: 0 }]}>
              <LinearGradient
                colors={['rgba(253,248,242,0.6)', 'rgba(45,125,70,0.05)', 'rgba(253,248,242,0.4)']}
                style={styles.mapPlaceholderGradient}
              />
              <View style={styles.mapPlaceholderContent}>
                <FontAwesome6 name="map-location-dot" size={48} color={currentRegion?.color || t.info} />
                <Text style={styles.mapPlaceholderTitle}>{currentRegion?.name} · {currentRegion?.subtitle}</Text>
                <Text style={styles.mapPlaceholderHint}>地图加载中...</Text>
              </View>
            </View>
          )}
        </View>

        {/* 底部浮动面板 */}
        <View style={styles.bottomPanel}>
          <View style={styles.bottomPanelHandle} />

          {/* 锚点卡片行 */}
          <View style={styles.anchorListHeader}>
            <Text style={styles.anchorListTitle}>
              <FontAwesome6 name="map-pin" size={14} color={t.info} />
              {' '}{currentRegion?.name} · {regionAnchors.length} 个锚点
            </Text>
            {selectedAnchor && (
              <TouchableOpacity onPress={() => setSelectedAnchor(null)}>
                <FontAwesome6 name="xmark" size={16} color={t.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.anchorScrollContent}
          >
            {regionAnchors.map(anchor => (
              <TouchableOpacity
                key={anchor.id}
                style={[
                  styles.anchorCard,
                  selectedAnchor?.id === anchor.id && styles.anchorCardActive,
                  anchor.checked && styles.anchorCardChecked,
                ]}
                onPress={() => setSelectedAnchor(anchor)}
              >
                <View style={[
                  styles.anchorIcon,
                  { backgroundColor: REGION_COLORS[activeRegion] || t.info }
                ]}>
                  <FontAwesome6
                    name={getAnchorIcon(anchor.type) as any}
                    size={16}
                    color={t.textInverse}
                  />
                </View>
                <Text style={styles.anchorName} numberOfLines={1}>{anchor.name}</Text>
                {anchor.checked && (
                  <View style={styles.checkedMark}>
                    <FontAwesome6 name="check" size={10} color={t.textInverse} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 选中锚点详情 */}
          {selectedAnchor && (
            <View style={styles.anchorDetail}>
              <View style={styles.anchorDetailHeader}>
                <View style={[
                  styles.anchorDetailIcon,
                  { backgroundColor: REGION_COLORS[activeRegion] || t.info }
                ]}>
                  <FontAwesome6
                    name={getAnchorIcon(selectedAnchor.type) as any}
                    size={24}
                    color={t.textInverse}
                  />
                </View>
                <View style={styles.anchorDetailInfo}>
                  <Text style={styles.anchorDetailName}>{selectedAnchor.name}</Text>
                  <Text style={styles.anchorDetailCoords}>
                    {selectedAnchor.latitude.toFixed(4)}, {selectedAnchor.longitude.toFixed(4)}
                  </Text>
                </View>
                {selectedAnchor.checked && (
                  <View style={styles.checkedBadgeLarge}>
                    <FontAwesome6 name="check-circle" size={14} color={t.primary} />
                    <Text style={styles.checkedText}>已打卡</Text>
                  </View>
                )}
              </View>
              <Text style={styles.anchorDetailDesc}>{selectedAnchor.description}</Text>
              <View style={styles.anchorDetailActions}>
                {!selectedAnchor.checked && (
                  <LinearGradient
                    colors={[t.warning, '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkinBtnGradient}
                  >
                    <TouchableOpacity style={styles.checkinBtnInner} onPress={handleSelectFromGallery}>
                      <FontAwesome6 name="camera" size={16} color={t.textInverse} />
                      <Text style={styles.checkinBtnText}>去打卡</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
                {selectedAnchor.type === 'food' && (
                  <TouchableOpacity
                    style={[styles.npcChatBtn, { backgroundColor: t.goldLight, borderColor: t.goldBorder }]}
                    onPress={() => setNpcDialogOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.npcChatEmoji}>👴</Text>
                    <Text style={[styles.npcChatText, { color: t.gold }]}>和当地人聊聊</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 打卡确认弹窗 */}
      <Dialog isOpen={checkinModalVisible} onOpenChange={setCheckinModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title>确认打卡</Dialog.Title>
            <Dialog.Description>
              在「{selectedAnchor?.name}」完成打卡？
            </Dialog.Description>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCheckinModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmCheckin}
                disabled={isCheckingIn}
              >
                {isCheckingIn ? (
                  <Spinner size="sm" color={t.textInverse} />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={16} color={t.textInverse} />
                    <Text style={styles.confirmBtnText}>确认打卡</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* NPC 对话弹窗 */}
      <NpcChatDialog
        open={npcDialogOpen}
        onClose={() => setNpcDialogOpen(false)}
        npcId="npc-old-guangzhou"
        npcName="老广阿伯"
        anchorName={selectedAnchor?.name}
      />
    </Screen>
  );
}
