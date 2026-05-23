import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserProfile, getAchievements, getStats } from '@/services/api';
import { useUniwind, Uniwind } from 'uniwind';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spinner, Avatar, Separator, Skeleton, useToast } from '@/heroui';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  created_at: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useUniwind();
  const { toast } = useToast();
  const t = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setRefreshing(true);
      const [userData, achievementsData, statsData] = await Promise.all([
        getUserProfile(),
        getAchievements(),
        getStats(),
      ]);
      setUser(userData);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleEditProfile = () => {
    toast.show({ label: '编辑资料', description: '修改昵称和头像功能即将上线～' });
  };

  const handleChatWithAsui = () => {
    router.navigate('/(tabs)');
  };

  const handleSettingsPress = (itemId: string) => {
    switch (itemId) {
      case '1':
        handleEditProfile();
        break;
      case '2':
        toast.show({ label: '消息通知', description: '暂无新消息' });
        break;
      case '3':
        toast.show({ label: '隐私设置', description: '功能开发中～' });
        break;
      case '4': {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        Uniwind.setTheme(nextTheme);
        toast.show({ label: '主题已切换', description: `已切换至${nextTheme === 'dark' ? '深色' : '浅色'}模式`, variant: 'success' });
        break;
      }
      case '5':
        toast.show({ label: '帮助与反馈', description: '请通过 GitHub Issues 给我们反馈', duration: 6000 });
        break;
      case '6':
        toast.show({ label: '关于赛博派蒙', description: '赛博派蒙 · 旅游搭子 v1.0.0 — 你的广州探索AI伴侣' });
        break;
    }
  };

  const settingsMenu = [
    { id: '1', icon: 'user', title: '个人资料', arrow: true },
    { id: '2', icon: 'bell', title: '消息通知', arrow: true, badge: 0 },
    { id: '3', icon: 'shield-halved', title: '隐私设置', arrow: true },
    { id: '4', icon: 'palette', title: '主题设置', arrow: true, subtitle: theme === 'dark' ? '深色模式' : '浅色模式' },
    { id: '5', icon: 'circle-question', title: '帮助与反馈', arrow: true },
    { id: '6', icon: 'circle-info', title: '关于赛博派蒙', arrow: false },
  ];

  const expPercent = stats ? Math.min(100, (stats.user_exp / 2000) * 100) : 62.5;

  const displayedAchievements = showAllAchievements ? achievements : achievements.slice(0, 8);

  const footprintStats = [
    { label: '探索区域', value: stats ? `${stats.unlocked_regions}/${stats.total_regions}` : '2/7', icon: 'map', color: t.primary },
    { label: '打卡锚点', value: stats ? `${stats.checked_anchors}` : '12', icon: 'map-pin', color: t.danger },
    { label: '总打卡次数', value: stats ? `${stats.total_checkins}` : '28', icon: 'route', color: t.info },
    { label: '获得成就', value: stats ? `${stats.unlocked_achievements}/${stats.total_achievements}` : '4/10', icon: 'trophy', color: t.gold },
  ];

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  content: {
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: t.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  profileCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: t.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: t.text,
  },
  userTitle: {
    fontSize: 13,
    color: t.primary,
    marginTop: 2,
  },
  expBar: {
    height: 8,
    backgroundColor: t.primaryLight,
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  expFill: {
    height: '100%',
    borderRadius: 4,
  },
  expText: {
    position: 'absolute',
    right: 4,
    top: -2,
    fontSize: 9,
    color: t.textSecondary,
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.bg,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: t.primary,
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: t.text,
  },
  agentStatus: {
    fontSize: 12,
    color: t.textSecondary,
    marginTop: 2,
  },
  chatButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  chatButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: t.text,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 13,
    color: t.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (windowWidth - 44) / 2,
    backgroundColor: t.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  statCardTopLine: {
    height: 3,
    width: '100%',
    marginTop: -16,
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: t.text,
  },
  statLabel: {
    fontSize: 12,
    color: t.textSecondary,
    marginTop: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (windowWidth - 56) / 4,
    alignItems: 'center',
    padding: 8,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 11,
    color: t.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: t.textTertiary,
  },
  settingsCard: {
    backgroundColor: t.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsTitle: {
    fontSize: 15,
    color: t.text,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: t.textTertiary,
    marginTop: 2,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: t.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: t.textTertiary,
  },
}), [t, windowWidth]);

  if (isLoading) {
    return (
      <Screen>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Profile card skeleton */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Skeleton variant="shimmer" style={{ width: 72, height: 72, borderRadius: 36 }} />
              <View style={styles.profileInfo}>
                <Skeleton variant="shimmer" style={{ width: 120, height: 22, borderRadius: 6, marginBottom: 6 }} />
                <Skeleton variant="shimmer" style={{ width: 80, height: 14, borderRadius: 4, marginBottom: 12 }} />
                <Skeleton variant="shimmer" style={{ width: '100%', height: 8, borderRadius: 4 }} />
              </View>
            </View>
            <View style={styles.agentEntry}>
              <Skeleton variant="shimmer" style={{ width: 44, height: 44, borderRadius: 22 }} />
              <View style={styles.agentInfo}>
                <Skeleton variant="shimmer" style={{ width: 60, height: 16, borderRadius: 4, marginBottom: 4 }} />
                <Skeleton variant="shimmer" style={{ width: 100, height: 12, borderRadius: 3 }} />
              </View>
            </View>
          </View>

          {/* Stats skeleton */}
          <View style={styles.section}>
            <Skeleton variant="shimmer" style={{ width: 80, height: 18, borderRadius: 4, marginBottom: 16 }} />
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="shimmer" style={{ width: (windowWidth - 44) / 2, height: 100, borderRadius: 16, marginBottom: 12 }} />
              ))}
            </View>
          </View>

          {/* Settings skeleton */}
          <View style={styles.section}>
            <Skeleton variant="shimmer" style={{ width: 60, height: 18, borderRadius: 4, marginBottom: 16 }} />
            <View style={styles.settingsCard}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i}>
                  {i > 1 && <Separator />}
                  <View style={styles.settingsItem}>
                    <Skeleton variant="shimmer" style={{ width: 36, height: 36, borderRadius: 18 }} />
                    <Skeleton variant="shimmer" style={{ width: 100, height: 15, borderRadius: 4, marginLeft: 12 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[t.primary]} tintColor={t.primary} />
        }
      >
        {/* 用户信息卡片 */}
        <View style={[styles.profileCard, { paddingTop: 20 }]}>
          <LinearGradient
            colors={['rgba(45,125,70,0.08)', 'rgba(45,125,70,0.01)', 'transparent']}
            style={styles.profileCardGlow}
          />
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar size="lg" alt={`${user?.name || 'User'}'s avatar`} className="w-[72px] h-[72px] rounded-full border-3 border-[#2D7D46] shadow-primary">
                <Avatar.Image
                  source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                />
                <Avatar.Fallback />
              </Avatar>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{user?.level || 5}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || '羊城探索者'}</Text>
              <Text style={styles.userTitle}>寻穗探索者</Text>
              <View style={styles.expBar}>
                <LinearGradient
                  colors={[t.primary, t.gold]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.expFill, { width: `${expPercent}%` }]}
                />
                <Text style={styles.expText}>{user?.exp || 1250}/2000 EXP</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile} activeOpacity={0.6}>
              <FontAwesome6 name="pen" size={16} color={t.primary} />
            </TouchableOpacity>
          </View>

          {/* 阿穗互动入口 */}
          <View style={styles.agentEntry}>
            <View style={styles.agentAvatar}>
              <Avatar size="md" alt="Asui's avatar" className="w-[44px] h-[44px] rounded-full">
                <Avatar.Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop' }}
                />
                <Avatar.Fallback />
              </Avatar>
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>阿穗</Text>
              <Text style={styles.agentStatus}>正在等你聊天～</Text>
            </View>
            <LinearGradient
              colors={[t.primary, '#4DAE60']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.chatButtonGradient}
            >
              <TouchableOpacity style={styles.chatButtonInner} onPress={handleChatWithAsui} activeOpacity={0.7}>
                <FontAwesome6 name="comment-dots" size={18} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* 足迹统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>我的足迹</Text>
          <View style={styles.statsGrid}>
            {footprintStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statCardTopLine, { backgroundColor: stat.color }]} />
                <View style={[styles.statIcon, { backgroundColor: stat.color + '25' }]}>
                  <FontAwesome6 name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 成就墙 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>成就墙</Text>
            <TouchableOpacity onPress={() => setShowAllAchievements(!showAllAchievements)} activeOpacity={0.5}>
              <Text style={styles.seeAll}>{showAllAchievements ? '收起' : '查看全部'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsGrid}>
            {displayedAchievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.unlocked ? achievement.color + '20' : '#F0F0F0' },
                  ]}
                >
                  <FontAwesome6
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.unlocked ? achievement.color : '#CCC'}
                  />
                </View>
                <Text
                  style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}
                  numberOfLines={1}
                >
                  {achievement.unlocked ? achievement.name : '???'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 设置菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          <View style={styles.settingsCard}>
            {settingsMenu.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <Separator />}
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => handleSettingsPress(item.id)}
                  activeOpacity={0.5}
                >
                <View style={styles.settingsLeft}>
                  <View style={styles.settingsIcon}>
                    <FontAwesome6 name={item.icon as any} size={18} color={t.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.settingsTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.settingsRight}>
                  {(item.badge ?? 0) > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.arrow && (
                    <FontAwesome6 name="chevron-right" size={16} color={t.textTertiary} />
                  )}
                </View>
              </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>赛博派蒙·旅游搭子 v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
