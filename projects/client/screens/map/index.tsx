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

// 条件导入高德地图 SDK
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let AMapLBS: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  const amap = require('react-native-amap3d');
  MapView = amap.MapView;
  Marker = amap.Marker;
  Callout = amap.Callout;
  AMapLBS = amap.AMapLBS;
  Polyline = amap.Polyline;
}

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
  const [showWebTip, setShowWebTip] = useState(false);
  const [mapCenter, setMapCenter] = useState(GUANGZHOU_CENTER);
  
  // 打卡相关状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    // Web 平台显示提示
    if (Platform.OS === 'web') {
      setShowWebTip(true);
      setIsLoading(false);
    } else {
      loadData();
      getUserLocation();
    }
  }, []);

  useEffect(() => {
    // 区域切换时更新地图中心
    const center = REGION_COORDINATES[activeRegion] || GUANGZHOU_CENTER;
    setMapCenter(center);
  }, [activeRegion]);

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
      setRegions([
        { id: 'yuexiu', name: '越秀', subtitle: '五羊圣地', color: '#8B4513', icon: 'landmark', unlocked: true },
        { id: 'liwan', name: '荔湾', subtitle: '西关风华', color: '#DAA520', icon: 'store', unlocked: true },
        { id: 'haizhu', name: '海珠', subtitle: '珠水映城', color: '#4682B4', icon: 'water', unlocked: false },
        { id: 'tianhe', name: '天河', subtitle: 'CBD繁华', color: '#9370DB', icon: 'building', unlocked: false },
      ]);
      
      setAnchors([
        { id: '1', name: '五羊石像', region_id: 'yuexiu', latitude: 23.1291, longitude: 113.2644, type: 'landmark', unlocked: true, checked: true, description: '广州城市标志，五羊传说的发源地' },
        { id: '2', name: '镇海楼', region_id: 'yuexiu', latitude: 23.1350, longitude: 113.2610, type: 'landmark', unlocked: true, checked: true, description: '岭南第一楼，始建于明朝' },
        { id: '3', name: '陈家祠', region_id: 'yuexiu', latitude: 23.1295, longitude: 113.2420, type: 'landmark', unlocked: true, checked: false, description: '广东民间工艺博物馆，建筑艺术瑰宝' },
        { id: '4', name: '点都德', region_id: 'yuexiu', latitude: 23.1275, longitude: 113.2580, type: 'food', unlocked: true, checked: false, description: '老字号茶楼，早茶必去' },
        { id: '5', name: '沙面岛', region_id: 'liwan', latitude: 23.1195, longitude: 113.2440, type: 'secret', unlocked: true, checked: false, description: '隐秘角落，充满历史感的欧式建筑群' },
        { id: '6', name: '永庆坊', region_id: 'liwan', latitude: 23.1180, longitude: 113.2400, type: 'landmark', unlocked: false, checked: false, description: '恩宁路历史文化街区，活化更新典范' },
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

  // 导航到锚点（使用高德地图 App）
  const handleNavigate = () => {
    if (!selectedAnchor) return;
    
    // 高德地图导航链接
    const url = `androidamap://route?sourceApplication=广州探索&dlat=${selectedAnchor.latitude}&dlon=${selectedAnchor.longitude}&dname=${encodeURIComponent(selectedAnchor.name)}&dev=0&t=1`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('提示', '无法打开地图导航，请安装高德地图App');
      }
    });
  };

  // 在地图上标记锚点
  const handleMarkerClick = (anchor: Anchor) => {
    setSelectedAnchor(anchor);
  };

  // Web 平台提示界面
  if (showWebTip) {
    return (
      <Screen>
        <View style={[styles.webTipContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.webTipIcon}>
            <FontAwesome6 name="map-location-dot" size={64} color="#4A90A4" />
          </View>
          <Text style={styles.webTipTitle}>高德地图需要真机体验</Text>
          <Text style={styles.webTipDesc}>
            地图功能需要运行在真机上才能使用{'\n'}
            请执行以下步骤生成本地项目：
          </Text>
          <View style={styles.webTipCode}>
            <Text style={styles.webTipCodeText}>cd /workspace/projects/projects</Text>
            <Text style={styles.webTipCodeText}>npx expo prebuild</Text>
            <Text style={styles.webTipCodeText}>npx expo run:android</Text>
          </View>
          <Text style={styles.webTipNote}>
            高德地图 Key 已配置完成：{'\n'}
            c5940539ec568301d498ff1c4625fc2b
          </Text>
        </View>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90A4" />
        <Text style={styles.loadingText}>加载地图数据...</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* 顶部区域 */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>探索地图</Text>
          {stats && (
            <View style={styles.statsBadge}>
              <FontAwesome6 name="check-circle" size={12} color="#52c41a" />
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
                activeRegion === region.id && styles.regionChipActive,
                !region.unlocked && styles.regionChipLocked,
              ]}
              onPress={() => region.unlocked && setActiveRegion(region.id)}
            >
              <FontAwesome6 
                name={region.icon as any} 
                size={14} 
                color={activeRegion === region.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.regionChipText,
                activeRegion === region.id && styles.regionChipTextActive,
              ]}>
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
        <MapView
          style={styles.map}
          centerCoordinate={mapCenter}
          showsUserLocation={true}
          userLocationRepresentation={{
            showsAccuracyRing: true,
            showsHeadingIndicator: false,
          }}
          zoomLevel={14}
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          {/* 锚点标记 */}
          {regionAnchors.map(anchor => (
            <Marker
              key={anchor.id}
              iconData={anchor.checked ? 0xe6a4 : 0xe677}
              iconFactory="FontAwesome6"
              position={{
                latitude: anchor.latitude,
                longitude: anchor.longitude,
              }}
              onPress={() => handleMarkerClick(anchor)}
            >
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <View style={styles.calloutHeader}>
                    <View style={[styles.calloutDot, { backgroundColor: anchor.type === 'landmark' ? '#4A90A4' : anchor.type === 'food' ? '#F59E0B' : '#9333EA' }]} />
                    <Text style={styles.calloutTitle}>{anchor.name}</Text>
                    {anchor.checked && (
                      <View style={styles.checkedBadge}>
                        <FontAwesome6 name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.calloutDesc}>{anchor.description}</Text>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* 已解锁区域连接线 */}
          {userLocation && (
            <Polyline
              coordinates={[
                userLocation,
                ...regionAnchors.map(a => ({ latitude: a.latitude, longitude: a.longitude }))
              ]}
              strokeColor="rgba(74, 144, 164, 0.3)"
              strokeWidth={2}
            />
          )}
        </MapView>

        {/* 定位按钮 */}
        <TouchableOpacity 
          style={[styles.locationBtn, { bottom: 20 }]}
          onPress={getUserLocation}
        >
          <FontAwesome6 name="location-crosshairs" size={20} color="#4A90A4" />
        </TouchableOpacity>
      </View>

      {/* 锚点列表 */}
      <View style={styles.anchorListContainer}>
        <View style={styles.anchorListHeader}>
          <Text style={styles.anchorListTitle}>
            <FontAwesome6 name="map-pin" size={14} color="#4A90A4" /> 
            {' '}{currentRegion?.name} · {regionAnchors.length} 个锚点
          </Text>
          {locationLoading && <ActivityIndicator size="small" color="#4A90A4" />}
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
              onPress={() => handleMarkerClick(anchor)}
            >
              <View style={[
                styles.anchorIcon,
                { backgroundColor: anchor.type === 'landmark' ? '#4A90A4' : anchor.type === 'food' ? '#F59E0B' : '#9333EA' }
              ]}>
                <FontAwesome6 
                  name={getAnchorIcon(anchor.type) as any} 
                  size={16} 
                  color="#fff" 
                />
              </View>
              <Text style={styles.anchorName} numberOfLines={1}>{anchor.name}</Text>
              {anchor.checked && (
                <View style={styles.checkedMark}>
                  <FontAwesome6 name="check" size={10} color="#fff" />
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
                { backgroundColor: selectedAnchor.type === 'landmark' ? '#4A90A4' : selectedAnchor.type === 'food' ? '#F59E0B' : '#9333EA' }
              ]}>
                <FontAwesome6 
                  name={getAnchorIcon(selectedAnchor.type) as any} 
                  size={24} 
                  color="#fff" 
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
                  <FontAwesome6 name="check-circle" size={14} color="#52c41a" />
                  <Text style={styles.checkedText}>已打卡</Text>
                </View>
              )}
            </View>
            <Text style={styles.anchorDetailDesc}>{selectedAnchor.description}</Text>
            <View style={styles.anchorDetailActions}>
              <TouchableOpacity style={styles.navBtn} onPress={handleNavigate}>
                <FontAwesome6 name=" Location-arrow" size={16} color="#fff" />
                <Text style={styles.navBtnText}>导航</Text>
              </TouchableOpacity>
              {!selectedAnchor.checked && (
                <TouchableOpacity style={styles.checkinBtn} onPress={handleCheckin}>
                  <FontAwesome6 name="camera" size={16} color="#fff" />
                  <Text style={styles.checkinBtnText}>去打卡</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 打卡模态框 */}
      <Modal
        visible={checkinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>确认打卡</Text>
              <TouchableOpacity onPress={() => setCheckinModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            
            <Text style={styles.checkinConfirmText}>
              在「{selectedAnchor?.name}」完成打卡？
            </Text>
            
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={16} color="#fff" />
                    <Text style={styles.confirmBtnText}>确认打卡</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  // Web 提示样式
  webTipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f7fa',
  },
  webTipIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  webTipTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  webTipDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  webTipCode: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  webTipCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#52c41a',
    marginVertical: 4,
  },
  webTipNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 顶部区域
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6ffed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52c41a',
  },
  regionScroll: {
    flexGrow: 0,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  regionChipActive: {
    backgroundColor: '#4A90A4',
  },
  regionChipLocked: {
    opacity: 0.5,
  },
  regionChipText: {
    fontSize: 14,
    color: '#666',
  },
  regionChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: 4,
  },
  // 地图区域
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationBtn: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // 气泡样式
  calloutContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  calloutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  checkedBadge: {
    backgroundColor: '#52c41a',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // 锚点列表
  anchorListContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
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
    color: '#333',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    marginHorizontal: 4,
    position: 'relative',
  },
  anchorCardActive: {
    backgroundColor: '#E8F4F8',
    borderWidth: 2,
    borderColor: '#4A90A4',
  },
  anchorCardChecked: {
    backgroundColor: '#f0fff4',
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
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  checkedMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#52c41a',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 选中锚点详情
  anchorDetail: {
    padding: 16,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 2,
  },
  anchorDetailCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  checkedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6ffed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  checkedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52c41a',
    marginLeft: 4,
  },
  anchorDetailDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 14,
  },
  anchorDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90A4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  checkinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  checkinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // 打卡模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  checkinConfirmText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4A90A4',
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
