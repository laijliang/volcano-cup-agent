import { useState, useEffect, useRef } from 'react';
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
  Platform,
  Linking,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getRegions, getAnchors, createCheckin, getStats } from '@/services/api';

const { width, height } = Dimensions.get('window');

// 广州坐标（默认中心点）
const GUANGZHOU_CENTER = {
  latitude: 23.1291,
  longitude: 113.2644,
};

// 广州各区坐标
const REGION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  yuexiu: { latitude: 23.1291, longitude: 113.2644 },     // 越秀区
  liwan: { latitude: 23.1206, longitude: 113.2444 },        // 荔湾区
  haizhu: { latitude: 23.0907, longitude: 113.2984 },       // 海珠区
  tianhe: { latitude: 23.1291, longitude: 113.3544 },      // 天河区
  panyu: { latitude: 22.9891, longitude: 113.3644 },       // 番禺区
  baiyun: { latitude: 23.1606, longitude: 113.3044 },       // 白云区
  huangpu: { latitude: 23.1806, longitude: 113.4544 },      // 黄埔区
};

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

// 获取锚点图标名称（高德地图用）
const getAmapIcon = (type: string) => {
  switch (type) {
    case 'landmark':
      return 'location';
    case 'food':
      return 'food';
    case 'secret':
      return 'star1';
    default:
      return 'marker';
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // 打卡相关状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('获取位置失败:', error);
      // 默认使用广州市中心
      setUserLocation(GUANGZHOU_CENTER);
    } finally {
      setLocationLoading(false);
    }
  };

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
        { id: 'tianhe', name: '天河', subtitle: 'CBD繁华', color: '#9370DB', icon: 'building', unlocked: false },
      ]);
      
      // 广州著名地标的真实坐标
      setAnchors([
        { 
          id: '1', 
          name: '五羊石像', 
          region_id: 'yuexiu', 
          latitude: 23.1291, 
          longitude: 113.2644, 
          type: 'landmark', 
          unlocked: true, 
          checked: true,
          description: '广州城市标志，五羊传说的发源地'
        },
        { 
          id: '2', 
          name: '镇海楼', 
          region_id: 'yuexiu', 
          latitude: 23.1350, 
          longitude: 113.2610, 
          type: 'landmark', 
          unlocked: true, 
          checked: true,
          description: '岭南第一楼，始建于明朝'
        },
        { 
          id: '3', 
          name: '陈家祠', 
          region_id: 'yuexiu', 
          latitude: 23.1295, 
          longitude: 113.2420, 
          type: 'landmark', 
          unlocked: true, 
          checked: false,
          description: '广东民间工艺博物馆，建筑艺术瑰宝'
        },
        { 
          id: '4', 
          name: '点都德', 
          region_id: 'yuexiu', 
          latitude: 23.1275, 
          longitude: 113.2580, 
          type: 'food', 
          unlocked: true, 
          checked: false,
          description: '老字号茶楼，早茶必去'
        },
        { 
          id: '5', 
          name: '沙面岛', 
          region_id: 'liwan', 
          latitude: 23.1195, 
          longitude: 113.2440, 
          type: 'secret', 
          unlocked: true, 
          checked: false,
          description: '隐秘角落，充满历史感的欧式建筑群'
        },
        { 
          id: '6', 
          name: '永庆坊', 
          region_id: 'liwan', 
          latitude: 23.1180, 
          longitude: 113.2400, 
          type: 'landmark', 
          unlocked: false, 
          checked: false,
          description: '恩宁路历史文化街区，活化更新典范'
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRegion = regions.find(r => r.id === activeRegion);
  const regionAnchors = anchors.filter(a => a.region_id === activeRegion);
  const regionCenter = REGION_COORDINATES[activeRegion] || GUANGZHOU_CENTER;

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

  // 导航到锚点
  const handleNavigate = () => {
    if (!selectedAnchor) return;
    
    const scheme = Platform.select({
      ios: 'ios',
      android: 'android',
    });
    
    const url = Platform.select({
      ios: `amap://navi?sourceApplication=广州探索&poiname=${selectedAnchor.name}&lat=${selectedAnchor.latitude}&lon=${selectedAnchor.longitude}&dev=1`,
      android: `amap://navi?sourceApplication=广州探索&poiname=${selectedAnchor.name}&lat=${selectedAnchor.latitude}&lon=${selectedAnchor.longitude}&dev=1`,
    });

    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // 如果没有安装高德地图，尝试打开网页版
        const webUrl = `https://restapi.amap.com/v3/navigation/regeo?key=c5940539ec568301d498ff1c4625fc2b&location=${selectedAnchor.longitude},${selectedAnchor.latitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  // 渲染模拟地图（Web端或地图加载前）
  const renderFallbackMap = () => (
    <View style={styles.mapContainer}>
      {/* 地图背景 */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&h=800&fit=crop' }}
        style={styles.mapBackground}
        resizeMode="cover"
      />
      
      {/* 半透明遮罩 */}
      <View style={styles.mapOverlay} />
      
      {/* 地图中心标记 */}
      <View style={styles.mapCenter}>
        <View style={styles.mapCenterPin}>
          <FontAwesome6 name="map-marker-alt" size={40} color="#2D7D46" />
        </View>
        <Text style={styles.mapCenterText}>{currentRegion?.name || '广州'}</Text>
      </View>

      {/* 模拟锚点标记 */}
      {regionAnchors.map((anchor, index) => {
        const positions = [
          { left: '20%', top: '30%' },
          { left: '60%', top: '25%' },
          { left: '35%', top: '55%' },
          { left: '70%', top: '60%' },
          { left: '25%', top: '75%' },
          { left: '75%', top: '40%' },
        ];
        const pos = positions[index % positions.length];
        
        return (
          <TouchableOpacity
            key={anchor.id}
            style={[
              styles.fallbackAnchor,
              { left: pos.left, top: pos.top },
              anchor.checked && styles.fallbackAnchorChecked,
            ]}
            onPress={() => setSelectedAnchor(anchor)}
          >
            <View style={[
              styles.fallbackAnchorInner,
              { backgroundColor: anchor.checked ? '#2D7D46' : currentRegion?.color || '#2D7D46' }
            ]}>
              <FontAwesome6
                name={getAnchorIcon(anchor.type) as any}
                size={18}
                color="#FFF"
              />
            </View>
            {anchor.checked && (
              <View style={styles.fallbackAnchorBadge}>
                <FontAwesome6 name="check" size={10} color="#FFF" />
              </View>
            )}
            <Text style={styles.fallbackAnchorLabel} numberOfLines={1}>
              {anchor.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* 定位按钮 */}
      <TouchableOpacity style={styles.locationButton} onPress={getUserLocation}>
        {locationLoading ? (
          <ActivityIndicator size="small" color="#2D7D46" />
        ) : (
          <FontAwesome6 name="-location-crosshairs" size={20} color="#2D7D46" />
        )}
      </TouchableOpacity>

      {/* 地图加载提示 */}
      <View style={styles.mapHint}>
        <FontAwesome6 name="info-circle" size={14} color="#FFF" />
        <Text style={styles.mapHintText}>点击标记查看详情</Text>
      </View>
    </View>
  );

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
        {/* 顶部区域 */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>广州大世界</Text>
              <Text style={styles.headerSubtitle}>寻穗纪 · 羊城秘境</Text>
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

        {/* 地图区域 - 使用模拟地图 */}
        {renderFallbackMap()}

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
            {selectedAnchor.description && (
              <Text style={styles.anchorDescription}>{selectedAnchor.description}</Text>
            )}
            
            {/* 坐标信息 */}
            <View style={styles.coordinateInfo}>
              <FontAwesome6 name="location-dot" size={12} color="#999" />
              <Text style={styles.coordinateText}>
                {selectedAnchor.latitude.toFixed(4)}, {selectedAnchor.longitude.toFixed(4)}
              </Text>
            </View>
            
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
                  
                  <TouchableOpacity 
                    style={[styles.actionButtonSecondary, { borderColor: currentRegion?.color }]}
                    onPress={handleNavigate}
                  >
                    <FontAwesome6 name="location-arrow" size={16} color={currentRegion?.color} />
                    <Text style={[styles.actionButtonTextSecondary, { color: currentRegion?.color }]}>导航</Text>
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
  
  // 地图容器
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
    position: 'absolute',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 245, 233, 0.3)',
  },
  mapCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: 'center',
  },
  mapCenterPin: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapCenterText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D7D46',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  
  // 模拟锚点标记
  fallbackAnchor: {
    position: 'absolute',
    alignItems: 'center',
  },
  fallbackAnchorInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  fallbackAnchorChecked: {
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  fallbackAnchorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  fallbackAnchorLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    maxWidth: 60,
  },
  
  // 定位按钮
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // 地图提示
  mapHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mapHintText: {
    fontSize: 12,
    color: '#FFF',
  },
  
  // 锚点详情卡片
  anchorDetail: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  anchorDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  anchorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  coordinateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  coordinateText: {
    fontSize: 12,
    color: '#999',
  },
  anchorDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  actionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
  lockedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    gap: 8,
  },
  lockedText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 底部任务提示
  taskHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  taskHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D7D46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.88,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  checkinHint: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  modalButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2D7D46',
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
});
