import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getMainQuests, getSideQuests, getStats } from '@/services/api';

interface MainQuest {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: string;
  region: string;
  reward: string;
}

interface SideQuest {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: string;
  reward: number;
  locations: string[];
}

const getQuestIcon = (type: string) => {
  switch (type) {
    case 'food': return 'utensils';
    case 'culture': return 'landmark';
    case 'secret': return 'star';
    default: return 'scroll';
  }
};

const FILTER_OPTIONS = ['全部', '美食', '人文', '隐藏'];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useAppTheme();
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('main');
  const [activeFilter, setActiveFilter] = useState('全部');

  const [mainQuests, setMainQuests] = useState<MainQuest[]>([]);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [stats, setStats] = useState<{ completed_quests?: number; active_quests?: number; total_progress?: number; unlocked_regions?: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setRefreshing(true);
      const [mainData, sideData, statsData] = await Promise.all([
        getMainQuests(),
        getSideQuests(),
        getStats(),
      ]);
      setMainQuests(mainData);
      setSideQuests(sideData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load quests:', error);
      // Fallback data so page works offline
      setMainQuests([
        { id: '1', chapter: '第一章', title: '五羊传说', subtitle: '探索越秀区的五羊石像，了解广州的起源传说', progress: 2, total: 5, status: 'active', region: 'yuexiu', reward: '解锁五羊石像徽章' },
        { id: '2', chapter: '第二章', title: '西关风情', subtitle: '走进荔湾老街，感受岭南建筑的独特魅力', progress: 0, total: 4, status: 'locked', region: 'liwan', reward: '解锁永庆坊打卡点' },
        { id: '3', chapter: '第三章', title: '珠江夜游', subtitle: '沿珠江两岸探索，发现广州的璀璨夜景', progress: 0, total: 6, status: 'locked', region: 'haizhu', reward: '解锁珠江夜游路线' },
      ]);
      setSideQuests([
        { id: 's1', type: 'food', title: '寻味广州', subtitle: '品尝三家老字号餐厅的招牌美食', progress: 1, total: 3, status: 'active', reward: 300, locations: ['点都德', '陶陶居', '广州酒家'] },
        { id: 's2', type: 'culture', title: '博物馆巡礼', subtitle: '参观广州各大博物馆，了解岭南文化', progress: 0, total: 4, status: 'locked', reward: 500, locations: ['广东省博物馆', '南越王博物馆', '广州博物馆', '粤剧艺术博物馆'] },
        { id: 's3', type: 'secret', title: '隐藏宝藏', subtitle: '寻找三个隐藏在城市角落的秘密打卡点', progress: 0, total: 3, status: 'hidden', reward: 800, locations: [] },
        { id: 's4', type: 'food', title: '甜品猎人', subtitle: '打卡广州最受欢迎的甜品店', progress: 2, total: 2, status: 'completed', reward: 200, locations: ['南信牛奶甜品', '仁信老铺'] },
      ]);
      setStats(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const filteredSideQuests = useMemo(() => {
    if (activeFilter === '全部') return sideQuests;
    const typeMap: Record<string, string> = { '美食': 'food', '人文': 'culture', '隐藏': 'secret' };
    return sideQuests.filter(q => q.type === typeMap[activeFilter]);
  }, [sideQuests, activeFilter]);

  const completedCount = stats?.completed_quests ?? mainQuests.filter(q => q.status === 'completed').length + sideQuests.filter(q => q.status === 'completed').length;
  const activeCount = stats?.active_quests ?? mainQuests.filter(q => q.status === 'active').length + sideQuests.filter(q => q.status === 'active').length;
  const totalProgress = stats?.total_progress ?? Math.round(
    (mainQuests.reduce((s, q) => s + q.progress, 0) + sideQuests.reduce((s, q) => s + q.progress, 0)) /
    Math.max(1, mainQuests.reduce((s, q) => s + q.total, 0) + sideQuests.reduce((s, q) => s + q.total, 0)) * 100
  );

  const handleContinueQuest = (quest: MainQuest) => {
    router.navigate({ pathname: '/(tabs)/map', params: { region: quest.region } });
  };

  const renderMainQuest = (quest: MainQuest) => {
    const isLocked = quest.status === 'locked';
    const isActive = quest.status === 'active';

    return (
      <View key={quest.id} style={[styles.questCard, isLocked && styles.questCardLocked]}>
        {isActive && (
          <View style={styles.questBadge}>
            <Text style={styles.questBadgeText}>进行中</Text>
          </View>
        )}
        {isLocked && (
          <View style={[styles.questBadge, styles.questBadgeLocked]}>
            <FontAwesome6 name="lock" size={10} color={t.textTertiary} />
            <Text style={[styles.questBadgeText, { color: t.textTertiary }]}>未解锁</Text>
          </View>
        )}

        <View style={styles.questHeader}>
          <View style={styles.chapterBadge}>
            <Text style={styles.chapterText}>{quest.chapter}</Text>
          </View>
          {isActive && (
            <Text style={styles.rewardText}>
              <FontAwesome6 name="gift" size={12} color={t.gold} /> {quest.reward}
            </Text>
          )}
        </View>

        <Text style={[styles.questTitle, isLocked && styles.questTitleLocked]}>
          {quest.title}
        </Text>
        <Text style={[styles.questSubtitle, isLocked && styles.questSubtitleLocked]}>
          {quest.subtitle}
        </Text>

        {isActive && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[t.primary, '#4DAE60', '#5EBE70']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${(quest.progress / quest.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {quest.progress}/{quest.total}
            </Text>
          </View>
        )}

        {isActive && (
          <LinearGradient
            colors={[t.primary, '#4DAE60']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <TouchableOpacity style={styles.continueButtonInner} onPress={() => handleContinueQuest(quest)}>
              <Text style={styles.continueButtonText}>继续任务</Text>
              <FontAwesome6 name="arrow-right" size={14} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderSideQuest = (quest: SideQuest) => {
    const isCompleted = quest.status === 'completed';
    const isLocked = quest.status === 'locked';
    const isHidden = quest.status === 'hidden';
    const questColorMap: Record<string, string> = { food: t.danger, culture: t.primary, secret: t.gold };
    const color = questColorMap[quest.type] || t.info;

    if (isHidden) {
      return (
        <View key={quest.id} style={[styles.sideQuestCard, styles.sideQuestHidden]}>
          <View style={styles.hiddenOverlay}>
            <FontAwesome6 name="question" size={24} color={t.textTertiary} />
            <Text style={styles.hiddenText}>完成前置任务解锁</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={quest.id} style={[styles.sideQuestCard, isLocked && styles.sideQuestLocked]}>
        <View style={styles.sideQuestHeader}>
          <View style={[styles.sideQuestIcon, { backgroundColor: color + '20' }]}>
            <FontAwesome6
              name={getQuestIcon(quest.type) as any}
              size={18}
              color={isLocked ? t.textTertiary : color}
            />
          </View>
          <View style={styles.sideQuestInfo}>
            <View style={styles.sideQuestTitleRow}>
              <Text style={[styles.sideQuestTitle, isLocked && styles.sideQuestTitleLocked]}>
                {quest.title}
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <FontAwesome6 name="check" size={10} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={[styles.sideQuestSubtitle, isLocked && styles.sideQuestSubtitleLocked]}>
              {quest.subtitle}
            </Text>
          </View>
          <View style={styles.rewardBadge}>
            <Text style={[styles.rewardAmount, isLocked && styles.rewardAmountLocked]}>
              +{quest.reward}
            </Text>
          </View>
        </View>

        {quest.locations && quest.locations.length > 0 && (
          <View style={styles.locationsContainer}>
            {quest.locations.map((loc, idx) => (
              <View
                key={idx}
                style={[
                  styles.locationTag,
                  idx < quest.progress && styles.locationTagCompleted,
                ]}
              >
                <FontAwesome6
                  name={idx < quest.progress ? 'check-circle' : 'circle'}
                  size={12}
                  color={idx < quest.progress ? t.primary : t.textTertiary}
                />
                <Text
                  style={[
                    styles.locationText,
                    idx < quest.progress && styles.locationTextCompleted,
                  ]}
                >
                  {loc}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!isLocked && !isCompleted && (
          <View style={styles.sideQuestProgress}>
            <View style={styles.progressBarSmall}>
              <LinearGradient
                colors={[color + 'AA', color]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFillSmall,
                  { width: `${(quest.progress / quest.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressTextSmall}>
              {quest.progress}/{quest.total}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: t.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: t.text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  headerGlow: {
    height: 4,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: t.primaryBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: t.primary,
  },
  statLabel: {
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: t.primaryBorder,
    marginHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: t.surface,
    alignItems: 'center',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: t.border,
  },
  tabGradient: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabInner: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: t.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  questList: {
    flex: 1,
  },
  questListContent: {
    paddingHorizontal: 20,
  },
  mainProgressCard: {
    backgroundColor: t.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: t.primaryLight,
  },
  mainProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  mainProgressTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: t.text,
  },
  mainProgressPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: t.primary,
  },
  mainProgressBar: {
    height: 14,
    backgroundColor: t.primaryBg,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 7,
  },
  mainProgressRegions: {
    gap: 6,
  },
  mainProgressRegion: {
    fontSize: 13,
    color: t.textSecondary,
    lineHeight: 18,
  },
  questCard: {
    backgroundColor: t.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: t.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  questCardLocked: {
    opacity: 0.65,
  },
  questBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  questBadgeLocked: {
    backgroundColor: t.borderLight,
    borderColor: t.border,
  },
  questBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: t.primary,
    letterSpacing: 0.3,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterBadge: {
    backgroundColor: t.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chapterText: {
    fontSize: 12,
    color: t.textSecondary,
    fontWeight: '600',
  },
  rewardText: {
    fontSize: 12,
    color: t.gold,
    fontWeight: '500',
  },
  questTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: t.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  questTitleLocked: {
    color: t.textTertiary,
  },
  questSubtitle: {
    fontSize: 14,
    color: t.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  questSubtitleLocked: {
    color: t.textTertiary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: t.primaryBg,
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: t.primary,
  },
  continueButtonGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
  },
  filterChipActive: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  filterText: {
    fontSize: 14,
    color: t.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  sideQuestCard: {
    backgroundColor: t.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: t.borderLight,
  },
  sideQuestLocked: {
    opacity: 0.7,
  },
  sideQuestHidden: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: t.surfaceSecondary,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: t.border,
  },
  hiddenOverlay: {
    alignItems: 'center',
    gap: 10,
  },
  hiddenText: {
    fontSize: 14,
    color: t.textTertiary,
    fontWeight: '500',
  },
  sideQuestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideQuestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sideQuestInfo: {
    flex: 1,
  },
  sideQuestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideQuestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: t.text,
  },
  sideQuestTitleLocked: {
    color: t.textTertiary,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: t.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sideQuestSubtitle: {
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 4,
  },
  sideQuestSubtitleLocked: {
    color: t.textTertiary,
  },
  rewardBadge: {
    backgroundColor: t.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.goldBorder,
  },
  rewardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: t.gold,
  },
  rewardAmountLocked: {
    color: t.textTertiary,
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: t.surfaceTertiary,
    borderRadius: 10,
  },
  locationTagCompleted: {
    backgroundColor: t.primaryBg,
  },
  locationText: {
    fontSize: 13,
    color: t.textSecondary,
  },
  locationTextCompleted: {
    color: t.primary,
    fontWeight: '600',
  },
  sideQuestProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  progressBarSmall: {
    flex: 1,
    height: 8,
    backgroundColor: t.border,
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextSmall: {
    fontSize: 12,
    color: t.textSecondary,
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: t.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: t.textTertiary,
  },
  }), [t]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: 10 }]}>
            <Text style={styles.headerTitle}>任务中心</Text>
          </View>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={styles.loadingText}>加载任务中...</Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: 10 }]}>
          <Text style={styles.headerTitle}>任务中心</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>已完成</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>进行中</Text>
            </View>
          </View>
        </View>
        <LinearGradient
          colors={['rgba(45,125,70,0.12)', 'rgba(45,125,70,0.02)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.headerGlow}
        />

        <View style={styles.tabContainer}>
          {activeTab === 'main' ? (
            <LinearGradient
              colors={[t.primary, '#4DAE60']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <TouchableOpacity style={styles.tabInner} onPress={() => setActiveTab('main')}>
                <Text style={[styles.tabText, styles.tabTextActive]}>主线剧情</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('main')}>
              <Text style={styles.tabText}>主线剧情</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'side' ? (
            <LinearGradient
              colors={[t.primary, '#4DAE60']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <TouchableOpacity style={styles.tabInner} onPress={() => setActiveTab('side')}>
                <Text style={[styles.tabText, styles.tabTextActive]}>支线任务</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('side')}>
              <Text style={styles.tabText}>支线任务</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.questList}
          contentContainerStyle={[styles.questListContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[t.primary]} tintColor={t.primary} />
          }
        >
          {activeTab === 'main' ? (
            <>
              <View style={styles.mainProgressCard}>
                <View style={styles.mainProgressHeader}>
                  <Text style={styles.mainProgressTitle}>探索进度</Text>
                  <Text style={styles.mainProgressPercent}>{totalProgress}%</Text>
                </View>
                <View style={styles.mainProgressBar}>
                  <LinearGradient
                    colors={[t.primary, '#4DAE60', '#5EBE70']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.mainProgressFill, { width: `${totalProgress}%` }]}
                  />
                </View>
                <View style={styles.mainProgressRegions}>
                  <Text style={styles.mainProgressRegion}>
                    已解锁：{Array.isArray(stats?.unlocked_regions) ? stats.unlocked_regions.join('、') : '越秀区、荔湾区'}
                  </Text>
                  <Text style={styles.mainProgressRegion}>
                    待解锁：{stats?.unlocked_regions ? '更多区域探索中...' : '海珠区、天河区...'}
                  </Text>
                </View>
              </View>

              {mainQuests.map(renderMainQuest)}
            </>
          ) : (
            <>
              <View style={styles.filterContainer}>
                {FILTER_OPTIONS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredSideQuests.map(renderSideQuest)}
              {filteredSideQuests.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="inbox" size={40} color={t.textTertiary} />
                  <Text style={styles.emptyText}>暂无该类型的支线任务</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
