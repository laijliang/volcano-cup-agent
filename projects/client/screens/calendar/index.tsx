import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 打卡记录类型
interface CheckinRecord {
  id: string;
  name: string;
  location: string;
  image: string;
  type: string;
}

// 模拟打卡记录数据
const checkinData: Record<string, CheckinRecord[]> = {
  '2026-05-20': [
    { id: '1', name: '五羊石像', location: '越秀区', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', type: 'landmark' },
  ],
  '2026-05-18': [
    { id: '2', name: '镇海楼', location: '越秀区', image: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=200', type: 'landmark' },
    { id: '3', name: '点都德', location: '荔湾区', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200', type: 'food' },
  ],
  '2026-05-15': [
    { id: '4', name: '永庆坊', location: '荔湾区', image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=200', type: 'culture' },
  ],
  '2026-05-10': [
    { id: '5', name: '荔枝湾涌', location: '荔湾区', image: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=200', type: 'food' },
    { id: '6', name: '沙面岛', location: '荔湾区', image: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=200', type: 'culture' },
  ],
};

// 获取当前月份的日期
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const formatDate = (day: number) => {
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  const hasCheckin = (day: number) => {
    const dateStr = formatDate(day);
    return checkinData[dateStr] !== undefined;
  };

  const getCheckinCount = (day: number) => {
    const dateStr = formatDate(day);
    return checkinData[dateStr]?.length || 0;
  };

  const selectedCheckins = selectedDate ? checkinData[selectedDate] || [] : [];

  // 计算统计数据
  const totalDays = Object.keys(checkinData).length;
  const totalCheckins = Object.values(checkinData).reduce((sum, arr) => sum + arr.length, 0);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendar = () => {
    const days = [];
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day);
      const isToday = dateStr === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const hasData = hasCheckin(day);
      const checkinCount = getCheckinCount(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.dayCellToday,
            isSelected && styles.dayCellSelected,
          ]}
          onPress={() => setSelectedDate(hasData ? dateStr : null)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.dayTextToday,
              isSelected && styles.dayTextSelected,
            ]}
          >
            {day}
          </Text>
          {hasData && (
            <View style={styles.checkinDot}>
              <View style={styles.checkinDotInner}>
                <Text style={styles.checkinCount}>{checkinCount}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* 顶部 */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>回忆日历</Text>
          <Text style={styles.headerSubtitle}>记录你的每一次探索足迹</Text>
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <FontAwesome6 name="calendar-check" size={20} color="#2D7D46" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{totalDays}</Text>
              <Text style={styles.statLabel}>打卡天数</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <FontAwesome6 name="camera" size={20} color="#E85D4C" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{totalCheckins}</Text>
              <Text style={styles.statLabel}>打卡照片</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
              <FontAwesome6 name="fire" size={20} color="#9370DB" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>连续打卡</Text>
            </View>
          </View>
        </View>

        {/* 日历 */}
        <View style={styles.calendarContainer}>
          {/* 月份切换 */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
              <FontAwesome6 name="chevron-left" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{currentYear}年 {months[currentMonth]}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <FontAwesome6 name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 星期标题 */}
          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekCell}>
                <Text style={[styles.weekText, index === 0 && styles.weekendText]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>{renderCalendar()}</View>
        </View>

        {/* 选中日期的打卡记录 */}
        <View style={[styles.checkinList, { paddingBottom: insets.bottom + 100 }]}>
          <Text style={styles.checkinListTitle}>
            {selectedDate ? formatDisplayDate(selectedDate) + ' 的回忆' : '最近打卡'}
          </Text>
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.checkinScroll}
            >
              {selectedDate && selectedCheckins.length > 0 ? (
                selectedCheckins.map((checkin: CheckinRecord) => (
                  <View key={checkin.id} style={styles.checkinCard}>
                    <Image source={{ uri: checkin.image }} style={styles.checkinImage} />
                    <View style={styles.checkinOverlay}>
                      <Text style={styles.checkinName}>{checkin.name}</Text>
                      <Text style={styles.checkinLocation}>
                        <FontAwesome6 name="map-marker" size={10} color="#FFF" /> {checkin.location}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                Object.entries(checkinData)
                  .slice(0, 5)
                  .flatMap(([, checkins]) =>
                    checkins.map((checkin: CheckinRecord) => (
                      <View key={checkin.id} style={styles.checkinCard}>
                        <Image source={{ uri: checkin.image }} style={styles.checkinImage} />
                        <View style={styles.checkinOverlay}>
                          <Text style={styles.checkinName}>{checkin.name}</Text>
                          <Text style={styles.checkinLocation}>
                            <FontAwesome6 name="map-marker" size={10} color="#FFF" /> {checkin.location}
                          </Text>
                        </View>
                      </View>
                    ))
                  )
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F2',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#2D7D46',
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
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  calendarContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
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
    color: '#666',
  },
  weekendText: {
    color: '#E85D4C',
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
  dayCellToday: {},
  dayCellSelected: {},
  dayText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  dayTextToday: {
    color: '#2D7D46',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFF',
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
    backgroundColor: '#2D7D46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  checkinList: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  checkinListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  checkinScroll: {
    paddingRight: 16,
  },
  checkinCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  checkinImage: {
    width: '100%',
    height: '100%',
  },
  checkinOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  checkinName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  checkinLocation: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
