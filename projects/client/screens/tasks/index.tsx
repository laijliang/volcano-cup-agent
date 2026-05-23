import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 主线任务
const mainQuests = [
  {
    id: '1',
    chapter: '第一章',
    title: '寻穗之旅',
    subtitle: '初到广州，探索五羊圣地',
    progress: 3,
    total: 5,
    status: 'active',
    region: 'yuexiu',
    reward: '解锁镇海楼区域',
  },
  {
    id: '2',
    chapter: '第二章',
    title: '西关风情',
    subtitle: '走进荔湾，感受岭南韵味',
    progress: 0,
    total: 6,
    status: 'locked',
    region: 'liwan',
    reward: '解锁永庆坊',
  },
  {
    id: '3',
    chapter: '第三章',
    title: '珠江夜游',
    subtitle: '跨越珠水，眺望小蛮腰',
    progress: 0,
    total: 5,
    status: 'locked',
    region: 'haizhu',
    reward: '解锁广州塔',
  },
];

// 支线任务
const sideQuests = [
  {
    id: 's1',
    type: 'food',
    title: '早茶达人',
    subtitle: '品尝3家地道茶楼',
    progress: 1,
    total: 3,
    status: 'active',
    reward: 50,
    locations: ['点都德', '陶陶居', '莲香楼'],
  },
  {
    id: 's2',
    type: 'culture',
    title: '博物馆探索',
    subtitle: '参观2家博物馆',
    progress: 2,
    total: 2,
    status: 'completed',
    reward: 80,
    locations: ['南越王博物院', '广东省博物馆'],
  },
  {
    id: 's3',
    type: 'food',
    title: '肠粉寻味',
    subtitle: '寻找最正宗的布拉肠',
    progress: 0,
    total: 4,
    status: 'locked',
    reward: 30,
    locations: [],
  },
  {
    id: 's4',
    type: 'secret',
    title: '隐藏任务：老广的记忆',
    subtitle: '发现沙面岛的秘密...',
    progress: 0,
    total: 1,
    status: 'hidden',
    reward: 200,
    locations: [],
  },
];

const getQuestIcon = (type: string) => {
  switch (type) {
    case 'food':
      return 'utensils';
    case 'culture':
      return 'landmark';
    case 'secret':
      return 'star';
    default:
      return 'scroll';
  }
};

const getQuestColor = (type: string) => {
  switch (type) {
    case 'food':
      return '#E85D4C';
    case 'culture':
      return '#2D7D46';
    case 'secret':
      return '#D4A574';
    default:
      return '#4682B4';
  }
};

import { Dimensions } from 'react-native';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('main');

  const renderMainQuest = (quest: typeof mainQuests[0]) => {
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
            <FontAwesome6 name="lock" size={10} color="#999" />
            <Text style={[styles.questBadgeText, { color: '#999' }]}>未解锁</Text>
          </View>
        )}

        <View style={styles.questHeader}>
          <View style={styles.chapterBadge}>
            <Text style={styles.chapterText}>{quest.chapter}</Text>
          </View>
          {isActive && (
            <Text style={styles.rewardText}>
              <FontAwesome6 name="gift" size={12} color="#D4A574" /> {quest.reward}
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
              <View
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
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>继续任务</Text>
            <FontAwesome6 name="arrow-right" size={14} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSideQuest = (quest: typeof sideQuests[0]) => {
    const isCompleted = quest.status === 'completed';
    const isLocked = quest.status === 'locked';
    const isHidden = quest.status === 'hidden';
    const color = getQuestColor(quest.type);

    if (isHidden) {
      return (
        <View key={quest.id} style={[styles.sideQuestCard, styles.sideQuestHidden]}>
          <View style={styles.hiddenOverlay}>
            <FontAwesome6 name="question" size={24} color="#999" />
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
              color={isLocked ? '#999' : color}
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

        {quest.locations.length > 0 && (
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
                  color={idx < quest.progress ? '#2D7D46' : '#CCC'}
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
              <View
                style={[
                  styles.progressFillSmall,
                  { width: `${(quest.progress / quest.total) * 100}%`, backgroundColor: color },
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

  return (
    <Screen>
      <View style={styles.container}>
        {/* 顶部 */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>任务中心</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>已完成</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>进行中</Text>
            </View>
          </View>
        </View>

        {/* Tab切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'main' && styles.tabActive]}
            onPress={() => setActiveTab('main')}
          >
            <Text style={[styles.tabText, activeTab === 'main' && styles.tabTextActive]}>
              主线剧情
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'side' && styles.tabActive]}
            onPress={() => setActiveTab('side')}
          >
            <Text style={[styles.tabText, activeTab === 'side' && styles.tabTextActive]}>
              支线任务
            </Text>
          </TouchableOpacity>
        </View>

        {/* 任务列表 */}
        <ScrollView
          style={styles.questList}
          contentContainerStyle={[styles.questListContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'main' ? (
            <>
              {/* 主线进度总览 */}
              <View style={styles.mainProgressCard}>
                <View style={styles.mainProgressHeader}>
                  <Text style={styles.mainProgressTitle}>探索进度</Text>
                  <Text style={styles.mainProgressPercent}>15%</Text>
                </View>
                <View style={styles.mainProgressBar}>
                  <View style={styles.mainProgressFill} />
                </View>
                <View style={styles.mainProgressRegions}>
                  <Text style={styles.mainProgressRegion}>已解锁：越秀区、荔湾区</Text>
                  <Text style={styles.mainProgressRegion}>待解锁：海珠区、天河区...</Text>
                </View>
              </View>

              {mainQuests.map(renderMainQuest)}
            </>
          ) : (
            <>
              {/* 支线分类筛选 */}
              <View style={styles.filterContainer}>
                {['全部', '美食', '人文', '隐藏'].map((filter, idx) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, idx === 0 && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, idx === 0 && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {sideQuests.map(renderSideQuest)}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F2',
  },
  // 顶部区域 - 现代化设计
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#F0FFF4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D7D46',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#C6F6D5',
    marginHorizontal: 20,
  },
  // Tab切换 - 现代化胶囊设计
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
    backgroundColor: '#FFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tabActive: {
    backgroundColor: '#2D7D46',
    borderColor: '#2D7D46',
    shadowColor: '#2D7D46',
    shadowOpacity: 0.3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
  // 主线进度卡片
  mainProgressCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
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
    color: '#1A1A1A',
  },
  mainProgressPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D7D46',
  },
  mainProgressBar: {
    height: 14,
    backgroundColor: '#F0FFF4',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  mainProgressFill: {
    width: '15%',
    height: '100%',
    backgroundColor: '#2D7D46',
    borderRadius: 7,
  },
  mainProgressRegions: {
    gap: 6,
  },
  mainProgressRegion: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // 任务卡片 - 现代化设计
  questCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
  },
  questCardLocked: {
    opacity: 0.65,
  },
  questBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  questBadgeLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  questBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D7D46',
    letterSpacing: 0.3,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chapterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  rewardText: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '500',
  },
  questTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  questTitleLocked: {
    color: '#999',
  },
  questSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  questSubtitleLocked: {
    color: '#BBB',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0FFF4',
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2D7D46',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D7D46',
  },
  // 继续按钮 - 渐变风格
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D7D46',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // 筛选标签
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  filterChipActive: {
    backgroundColor: '#2D7D46',
    borderColor: '#2D7D46',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  // 支线任务卡片
  sideQuestCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  sideQuestLocked: {
    opacity: 0.7,
  },
  sideQuestHidden: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hiddenOverlay: {
    alignItems: 'center',
    gap: 10,
  },
  hiddenText: {
    fontSize: 14,
    color: '#999',
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
    color: '#1A1A1A',
  },
  sideQuestTitleLocked: {
    color: '#999',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sideQuestSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sideQuestSubtitleLocked: {
    color: '#BBB',
  },
  rewardBadge: {
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE4C4',
  },
  rewardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D4A574',
  },
  rewardAmountLocked: {
    color: '#CCC',
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  locationTagCompleted: {
    backgroundColor: '#F0FFF4',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  locationTextCompleted: {
    color: '#2D7D46',
    fontWeight: '600',
  },
  sideQuestProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressBarSmall: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
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
    color: '#666',
    fontWeight: '600',
  },
});
