import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getRegions, getAnchors, createCheckin, getStats } from '@/services/api';

const { width, height } = Dimensions.get('window');

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
  x: number;
  y: number;
  type: 'landmark' | 'food' | 'secret';
  unlocked: boolean;
  checked: boolean;
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [regions, setRegions] = useState<Region[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeRegion, setActiveRegion] = useState('yuexiu');
  const [selectedAnchor, setSelectedAnchor] = useState<Anchor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 打卡相关状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [regionsData, anchorsData, statsData] = await Promise.all([
        getRegions(),
        getAnchors(),
        getStats(),
      ]);
      setRegions(regionsData);
      setAnchors(anchorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // 使用默认数据
      setRegions([
        { id: 'yuexiu', name: '越秀', subtitle: '五羊圣地', color: '#8B4513', icon: 'landmark', unlocked: true },
        { id: 'liwan', name: '荔湾', subtitle: '西关风华', color: '#DAA520', icon: 'store', unlocked: true },
        { id: 'haizhu', name: '海珠', subtitle: '珠水映城', color: '#4682B4', icon: 'water', unlocked: false },
      ]);
      setAnchors([
        { id: '1', name: '五羊石像', region_id: 'yuexiu', x: 0.3, y: 0.4, type: 'landmark', unlocked: true, checked: true },
        { id: '2', name: '镇海楼', region_id: 'yuexiu', x: 0.35, y: 0.3, type: 'landmark', unlocked: true, checked: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRegion = regions.find(r => r.id === activeRegion);
  const regionAnchors = anchors.filter(a => a.region_id === activeRegion);

  // 拍照打卡
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相机权限才能拍照哦～');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
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

  // 从相册选择
  const handleSelectFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择照片哦～');
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

  // 确认打卡
  const handleConfirmCheckin = async () => {
    if (!selectedImage || !selectedAnchor) return;
    
    setIsCheckingIn(true);
    try {
      await createCheckin(selectedAnchor.id, selectedImage, currentRegion?.name || '');
      
      // 更新本地状态
      setAnchors(prev => prev.map(a => 
        a.id === selectedAnchor.id ? { ...a, checked: true } : a
      ));
      
      Alert.alert('打卡成功！', `恭喜你完成了「${selectedAnchor.name}」的打卡！`);
      setCheckinModalVisible(false);
      setSelectedImage(null);
      setSelectedAnchor(null);
      loadData();
    } catch (error) {
      Alert.alert('打卡失败', '请稍后重试');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 点击去打卡按钮
  const handleCheckin = () => {
    if (!selectedAnchor) return;
    
    Alert.alert(
      '选择打卡方式',
      `在「${selectedAnchor.name}」进行打卡`,
      [
        { text: '拍照', onPress: handleTakePhoto },
        { text: '从相册选择', onPress: handleSelectFromGallery },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2D7D46" />
          <Text style={styles.loadingText}>加载地图数据中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* 顶部区域切换 */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>广州大世界</Text>
              <Text style={styles.headerSubtitle}>寻穗纪·羊城秘境</Text>
            </View>
            {stats && (
              <View style={styles.progressBadge}>
                <Text style={styles.progressText}>
                  {stats.checked_anchors}/{stats.total_anchors}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 区域Tab */}
        <View style={styles.regionTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionTabsContent}
          >
            {regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={[
                  styles.regionTab,
                  activeRegion === region.id && styles.regionTabActive,
                  !region.unlocked && styles.regionTabLocked,
                ]}
                onPress={() => region.unlocked && setActiveRegion(region.id)}
              >
                <View
                  style={[
                    styles.regionTabIcon,
                    { backgroundColor: region.color + '20' },
                    activeRegion === region.id && { backgroundColor: region.color },
                  ]}
                >
                  <FontAwesome6
                    name={region.icon as any}
                    size={16}
                    color={activeRegion === region.id ? '#FFF' : region.color}
                  />
                </View>
                <Text
                  style={[
                    styles.regionTabName,
                    activeRegion === region.id && { color: region.color, fontWeight: '600' },
                  ]}
                >
                  {region.name}
                </Text>
                {!region.unlocked && (
                  <FontAwesome6 name="lock" size={10} color="#999" style={styles.lockIcon} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 地图区域 */}
        <View style={styles.mapContainer}>
          {/* 手绘风格地图背景 */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' }}
            style={styles.mapBackground}
            resizeMode="cover"
          />

          {/* 地图遮罩层（迷雾效果） */}
          <View style={styles.fogOverlay}>
            <View style={[styles.unlockedArea, { backgroundColor: currentRegion?.color + '10' }]} />
          </View>

          {/* 锚点标记 */}
          {regionAnchors.map((anchor) => {
            const isSelected = selectedAnchor?.id === anchor.id;

            return (
              <TouchableOpacity
                key={anchor.id}
                style={[
                  styles.anchor,
                  {
                    left: anchor.x * width * 0.85,
                    top: anchor.y * height * 0.35,
                  },
                  styles.anchorUnlocked,
                  isSelected && styles.anchorSelected,
                  { borderColor: currentRegion?.color },
                ]}
                onPress={() => setSelectedAnchor(anchor)}
              >
                <FontAwesome6
                  name={getAnchorIcon(anchor.type) as any}
                  size={20}
                  color={anchor.checked ? '#FFF' : currentRegion?.color}
                />
                {anchor.checked && (
                  <View style={styles.checkedBadge}>
                    <FontAwesome6 name="check" size={10} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* 当前位置指示器 */}
          <View style={styles.currentLocation}>
            <View style={styles.locationPulse} />
            <View style={styles.locationDot} />
          </View>
        </View>

        {/* 锚点详情卡片 */}
        {selectedAnchor && (
          <View style={styles.anchorDetail}>
            <View style={styles.anchorDetailHeader}>
              <View style={[styles.anchorTypeBadge, { backgroundColor: currentRegion?.color + '20' }]}>
                <FontAwesome6
                  name={getAnchorIcon(selectedAnchor.type) as any}
                  size={14}
                  color={currentRegion?.color}
                />
                <Text style={[styles.anchorTypeText, { color: currentRegion?.color }]}>
                  {selectedAnchor.type === 'landmark' ? '地标' : selectedAnchor.type === 'food' ? '美食' : '秘境'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAnchor(null)}>
                <FontAwesome6 name="times" size={18} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.anchorName}>{selectedAnchor.name}</Text>
            <View style={styles.anchorDetailActions}>
              {selectedAnchor.unlocked ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: currentRegion?.color }]}
                    onPress={handleCheckin}
                  >
                    <FontAwesome6 name="camera" size={16} color="#FFF" />
                    <Text style={styles.actionButtonText}>
                      {selectedAnchor.checked ? '再次打卡' : '去打卡'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButtonSecondary}>
                    <FontAwesome6 name="info" size={16} color={currentRegion?.color} />
                    <Text style={[styles.actionButtonTextSecondary, { color: currentRegion?.color }]}>详情</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.lockedInfo}>
                  <FontAwesome6 name="lock" size={16} color="#999" />
                  <Text style={styles.lockedText}>完成前置任务解锁</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 底部任务提示 */}
        <View style={[styles.taskHint, { paddingBottom: insets.bottom + 90 }]}>
          <View style={styles.taskHintContent}>
            <View style={styles.taskHintIcon}>
              <FontAwesome6 name="scroll" size={16} color="#2D7D46" />
            </View>
            <View style={styles.taskHintText}>
              <Text style={styles.taskHintTitle}>当前任务：探索{currentRegion?.subtitle || '广州'}</Text>
              <Text style={styles.taskHintSubtitle}>
                已完成 {regionAnchors.filter(a => a.checked).length}/{regionAnchors.length} 个锚点
              </Text>
            </View>
            <TouchableOpacity style={styles.taskHintButton}>
              <FontAwesome6 name="chevron-right" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 打卡确认弹窗 */}
        <Modal
          visible={checkinModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCheckinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>确认打卡</Text>
                <TouchableOpacity onPress={() => setCheckinModalVisible(false)}>
                  <FontAwesome6 name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              )}
              
              <Text style={styles.checkinHint}>
                确认在「{selectedAnchor?.name}」进行打卡？
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCheckinModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmCheckin}
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>确认打卡</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F2',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#2D7D46',
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D7D46',
  },
  regionTabs: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
  },
  regionTabsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  regionTab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
  },
  regionTabActive: {
    backgroundColor: '#F5F5F5',
  },
  regionTabLocked: {
    opacity: 0.6,
  },
  regionTabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  regionTabName: {
    fontSize: 12,
    color: '#666',
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  unlockedArea: {
    ...StyleSheet.absoluteFillObject,
  },
  anchor: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
  anchorUnlocked: {
    backgroundColor: '#FFF',
  },
  anchorSelected: {
    width: 52,
    height: 52,
    borderRadius: 26,
    transform: [{ translateX: -26 }, { translateY: -26 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  checkedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  currentLocation: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(45, 125, 70, 0.2)',
    position: 'absolute',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2D7D46',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  anchorDetail: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  anchorDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anchorTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  anchorTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  anchorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  anchorDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  lockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    color: '#999',
    fontSize: 14,
  },
  taskHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  taskHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  taskHintIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskHintText: {
    flex: 1,
  },
  taskHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  taskHintSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  taskHintButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D7D46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  checkinHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2D7D46',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
