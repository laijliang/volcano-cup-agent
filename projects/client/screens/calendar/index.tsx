import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getCheckins, updateCheckinPhoto } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { Spinner, Skeleton, Dialog, useToast } from '@/heroui';

const { width } = Dimensions.get('window');

interface CheckinRecord {
  id: string;
  name: string;
  location: string;
  image: string;
  type: string;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [checkinData, setCheckinData] = useState<Record<string, CheckinRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<CheckinRecord | null>(null);
  const [replaceImage, setReplaceImage] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setRefreshing(true);
      const data = await getCheckins();
      const grouped: Record<string, CheckinRecord[]> = {};
      data.forEach((c: any) => {
        const date = c.created_at?.split('T')[0] || c.created_at?.substring(0, 10) || '';
        if (date) {
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push({
            id: c.id || date,
            name: c.anchor_name || c.name || '打卡点',
            location: c.location || '',
            image: c.image_url || c.image || '',
            type: c.type || 'landmark',
          });
        }
      });
      setCheckinData(grouped);
    } catch (error: any) {
      console.error('Failed to load checkins:', error);
      setLoadError(error?.message || '加载失败');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCheckins(true);
  };

  const handleReplacePhoto = (checkin: CheckinRecord) => {
    setReplaceTarget(checkin);
    setReplaceImage(null);
  };

  const handlePickReplaceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show({ label: '提示', description: '需要相册权限' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReplaceImage(result.assets[0].uri);
    }
  };

  const handleConfirmReplace = async () => {
    if (!replaceTarget || !replaceImage) return;
    try {
      setIsReplacing(true);
      await updateCheckinPhoto(replaceTarget.id, replaceImage);
      toast.show({ label: '已更新', description: '照片已替换', variant: 'success' });
      setReplaceTarget(null);
      setReplaceImage(null);
      loadCheckins(true);
    } catch (error: any) {
      toast.show({ label: '替换失败', description: error.message || '请稍后重试' });
    } finally {
      setIsReplacing(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const formatDate = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  const hasCheckin = (day: number) => checkinData[formatDate(day)] !== undefined;
  const getCheckinCount = (day: number) => checkinData[formatDate(day)]?.length || 0;

  const selectedCheckins = selectedDate ? checkinData[selectedDate] || [] : [];

  const totalDays = Object.keys(checkinData).length;
  const totalCheckins = Object.values(checkinData).reduce((sum, arr) => sum + arr.length, 0);

  const consecutiveDays = useMemo(() => {
    const dates = Object.keys(checkinData).sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 0;
    const todayStr = formatDate(today.getDate());
    let check = todayStr;
    while (dates.includes(check)) {
      streak++;
      const prev = new Date(check);
      prev.setDate(prev.getDate() - 1);
      check = prev.toISOString().substring(0, 10);
    }
    return streak;
  }, [checkinData]);

  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const prevMonth = () => {
    setSelectedDate(null);
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const nextMonth = () => {
    setSelectedDate(null);
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const renderCalendar = () => {
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day);
      const isToday = dateStr === todayStr;
      const isSelected = selectedDate === dateStr;
      const hasData = hasCheckin(day);
      const count = getCheckinCount(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
          onPress={() => setSelectedDate(hasData ? dateStr : null)}
          activeOpacity={0.6}
        >
          <View style={[isToday && styles.todayRing, isSelected && styles.selectedBg]}>
            <Text style={[
              styles.dayText,
              isToday && styles.dayTextToday,
              isSelected && styles.dayTextSelected,
            ]}>
              {day}
            </Text>
          </View>
          {hasData && (
            <View style={styles.checkinDot}>
              <View style={styles.checkinDotInner}>
                <Text style={styles.checkinCount}>{count}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: t.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: t.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 2,
  },
  headerGlow: {
    height: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {},
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: t.text,
  },
  statLabel: {
    fontSize: 11,
    color: t.textSecondary,
  },
  calendarContainer: {
    marginHorizontal: 16,
    backgroundColor: t.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  calendarTopLine: {
    height: 3,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: t.text,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    color: t.textSecondary,
  },
  weekendText: {
    color: t.danger,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {},
  dayText: {
    fontSize: 15,
    color: t.text,
  },
  todayRing: {
    borderWidth: 2.5,
    borderColor: t.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBg: {
    backgroundColor: t.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTextToday: {
    color: t.primary,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: t.textInverse,
    fontWeight: '600',
  },
  checkinDot: {
    position: 'absolute',
    bottom: 4,
  },
  checkinDotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: t.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinCount: {
    fontSize: 10,
    fontWeight: '700',
    color: t.textInverse,
  },
  checkinList: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  checkinListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: t.text,
    marginBottom: 12,
  },
  checkinScroll: {
    paddingRight: 16,
    flexDirection: 'row' as const,
  },
  checkinCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  checkinImage: {
    width: '100%',
    height: '100%',
  },
  replaceBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: t.overlay,
  },
  checkinName: {
    fontSize: 14,
    fontWeight: '600',
    color: t.textInverse,
  },
  checkinLocation: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: t.textSecondary,
  },
  emptyCheckins: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyCheckinText: {
    fontSize: 14,
    color: t.textTertiary,
  },
}), [t]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: 10 }]}>
            <Skeleton variant="shimmer" style={{ width: 120, height: 24, borderRadius: 6, marginBottom: 4 }} />
            <Skeleton variant="shimmer" style={{ width: 180, height: 13, borderRadius: 3 }} />
          </View>

          {/* Stats skeleton */}
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="shimmer" style={{ flex: 1, height: 60, borderRadius: 16 }} />
            ))}
          </View>

          {/* Calendar skeleton */}
          <View style={styles.calendarContainer}>
            <Skeleton variant="shimmer" style={{ width: '100%', height: 300, borderRadius: 16 }} />
          </View>

          {/* Checkin list skeleton */}
          <View style={[styles.checkinList, { paddingBottom: insets.bottom + 100 }]}>
            <Skeleton variant="shimmer" style={{ width: 80, height: 16, borderRadius: 4, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="shimmer" style={{ width: 140, height: 180, borderRadius: 16 }} />
              ))}
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
          <FontAwesome6 name="triangle-exclamation" size={48} color={t.textTertiary} />
          <Text style={{ fontSize: 16, color: t.textSecondary, marginTop: 16, textAlign: 'center' }}>{loadError}</Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: t.primary, borderRadius: 24 }}
            onPress={() => { setLoadError(null); loadCheckins(); }}
          >
            <Text style={{ color: t.textInverse, fontWeight: '600' }}>重试</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[t.primary]} tintColor={t.primary} />
        }
      >
        <View style={[styles.header, { paddingTop: 10 }]}>
          <Text style={styles.headerTitle}>回忆日历</Text>
          <Text style={styles.headerSubtitle}>记录你的每一次探索足迹</Text>
        </View>
        <LinearGradient
          colors={['rgba(45,125,70,0.12)', 'rgba(45,125,70,0.02)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.headerGlow}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: t.primaryLight }]}>
              <FontAwesome6 name="calendar-check" size={20} color={t.primary} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{totalDays}</Text>
              <Text style={styles.statLabel}>打卡天数</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: t.danger + '30' }]}>
              <FontAwesome6 name="camera" size={20} color={t.danger} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{totalCheckins}</Text>
              <Text style={styles.statLabel}>打卡照片</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: t.purple + '30' }]}>
              <FontAwesome6 name="fire" size={20} color={t.purple} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{consecutiveDays}</Text>
              <Text style={styles.statLabel}>连续打卡</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <LinearGradient
            colors={[t.primary, t.gold, t.danger]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.calendarTopLine}
          />
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthButton} activeOpacity={0.6}>
              <FontAwesome6 name="chevron-left" size={20} color={t.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{currentYear}年 {months[currentMonth]}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton} activeOpacity={0.6}>
              <FontAwesome6 name="chevron-right" size={20} color={t.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekCell}>
                <Text style={[styles.weekText, (index === 0 || index === 6) && styles.weekendText]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>{renderCalendar()}</View>
        </View>

        <View style={styles.checkinList}>
          <Text style={styles.checkinListTitle}>
            {selectedDate ? formatDisplayDate(selectedDate) + ' 的回忆' : '最近打卡'}
          </Text>
          {selectedDate && selectedCheckins.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.checkinScroll}>
              {selectedCheckins.map((checkin) => (
                <View key={checkin.id} style={styles.checkinCard}>
                  <Image source={{ uri: checkin.image }} style={styles.checkinImage} />
                  <TouchableOpacity style={styles.replaceBtn} onPress={() => handleReplacePhoto(checkin)} activeOpacity={0.7}>
                    <FontAwesome6 name="pen" size={12} color="#FFF" />
                  </TouchableOpacity>
                  <View style={styles.checkinOverlay}>
                    <Text style={styles.checkinName}>{checkin.name}</Text>
                    <Text style={styles.checkinLocation}>
                      <FontAwesome6 name="map-marker" size={10} color={t.textInverse} /> {checkin.location}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : !selectedDate ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.checkinScroll}>
              {Object.entries(checkinData).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5).flatMap(([, checkins]) =>
                checkins.map((checkin) => (
                  <View key={checkin.id} style={styles.checkinCard}>
                    <Image source={{ uri: checkin.image }} style={styles.checkinImage} />
                    <TouchableOpacity style={styles.replaceBtn} onPress={() => handleReplacePhoto(checkin)} activeOpacity={0.7}>
                      <FontAwesome6 name="pen" size={12} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.checkinOverlay}>
                      <Text style={styles.checkinName}>{checkin.name}</Text>
                      <Text style={styles.checkinLocation}>
                        <FontAwesome6 name="map-marker" size={10} color={t.textInverse} /> {checkin.location}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyCheckins}>
              <FontAwesome6 name="camera-retro" size={32} color={t.textTertiary} />
              <Text style={styles.emptyCheckinText}>这天还没有打卡记录</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 替换照片弹窗 */}
      <Dialog isOpen={!!replaceTarget} onOpenChange={(open) => { if (!open) setReplaceTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title>替换照片</Dialog.Title>
            <Dialog.Description>
              为「{replaceTarget?.name}」选择一张新照片
            </Dialog.Description>

            <TouchableOpacity
              onPress={handlePickReplaceImage}
              style={{
                marginTop: 16,
                backgroundColor: t.surfaceSecondary,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: t.border,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                aspectRatio: 16 / 10,
              }}
              activeOpacity={0.7}
            >
              {replaceImage ? (
                <Image source={{ uri: replaceImage }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <FontAwesome6 name="camera" size={32} color={t.textTertiary} />
                  <Text style={{ fontSize: 14, color: t.textTertiary, marginTop: 8 }}>点击选择图片</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => { setReplaceTarget(null); setReplaceImage(null); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: t.surfaceSecondary, alignItems: 'center' }}
                disabled={isReplacing}
              >
                <Text style={{ fontSize: 16, color: t.textSecondary, fontWeight: '600' }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReplace}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: replaceImage ? t.primary : t.border, alignItems: 'center' }}
                disabled={isReplacing || !replaceImage}
              >
                {isReplacing ? (
                  <Spinner size="sm" color={t.textInverse} />
                ) : (
                  <Text style={{ fontSize: 16, color: replaceImage ? t.textInverse : t.textTertiary, fontWeight: '600' }}>确认替换</Text>
                )}
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Screen>
  );
}
