import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 成就数据
const achievements = [
  { id: '1', name: '初来乍到', icon: 'star', unlocked: true, color: '#FFD700' },
  { id: '2', name: '五羊探索者', icon: 'map', unlocked: true, color: '#8B4513' },
  { id: '3', name: '美食猎人', icon: 'utensils', unlocked: true, color: '#E85D4C' },
  { id: '4', name: '连续7天', icon: 'fire', unlocked: true, color: '#FF6B35' },
  { id: '5', name: '西关漫步', icon: 'walking', unlocked: false, color: '#DAA520' },
  { id: '6', name: '博物馆迷', icon: 'landmark', unlocked: false, color: '#2D7D46' },
  { id: '7', name: '夜景达人', icon: 'moon', unlocked: false, color: '#4682B4' },
  { id: '8', name: '隐藏成就', icon: 'question', unlocked: false, color: '#999' },
];

// 足迹统计
const footprintStats = [
  { label: '探索区域', value: '2/7', icon: 'map', color: '#2D7D46' },
  { label: '打卡锚点', value: '12', icon: 'map-pin', color: '#E85D4C' },
  { label: '累计里程', value: '25.6km', icon: 'route', color: '#4682B4' },
  { label: '获得成就', value: '4/10', icon: 'trophy', color: '#D4A574' },
];

// 设置菜单
const settingsMenu = [
  { id: '1', icon: 'user', title: '个人资料', arrow: true },
  { id: '2', icon: 'bell', title: '消息通知', arrow: true, badge: 3 },
  { id: '3', icon: 'shield-halved', title: '隐私设置', arrow: true },
  { id: '4', icon: 'palette', title: '主题设置', arrow: true },
  { id: '5', icon: 'question-circle', title: '帮助与反馈', arrow: true },
  { id: '6', icon: 'info-circle', title: '关于赛博派蒙', arrow: false },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息卡片 */}
        <View style={[styles.profileCard, { paddingTop: insets.top + 20 }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                style={styles.avatar}
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.5</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>羊城探索者</Text>
              <Text style={styles.userTitle}>初级寻穗者</Text>
              <View style={styles.expBar}>
                <View style={styles.expFill} />
                <Text style={styles.expText}>1250/2000 EXP</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <FontAwesome6 name="pen" size={16} color="#2D7D46" />
            </TouchableOpacity>
          </View>

          {/* 阿穗互动入口 */}
          <View style={styles.agentEntry}>
            <View style={styles.agentAvatar}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop' }}
                style={styles.agentAvatarImg}
              />
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>阿穗</Text>
              <Text style={styles.agentStatus}>正在等你聊天～</Text>
            </View>
            <TouchableOpacity style={styles.chatButton}>
              <FontAwesome6 name="comment-dots" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 足迹统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>我的足迹</Text>
          <View style={styles.statsGrid}>
            {footprintStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
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
            <TouchableOpacity>
              <Text style={styles.seeAll}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked,
                ]}
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
                  style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked,
                  ]}
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
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < settingsMenu.length - 1 && styles.settingsItemBorder,
                ]}
              >
                <View style={styles.settingsLeft}>
                  <View style={styles.settingsIcon}>
                    <FontAwesome6 name={item.icon as any} size={18} color="#666" />
                  </View>
                  <Text style={styles.settingsTitle}>{item.title}</Text>
                </View>
                <View style={styles.settingsRight}>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.arrow && (
                    <FontAwesome6 name="chevron-right" size={16} color="#CCC" />
                  )}
                </View>
              </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F2',
  },
  content: {
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#2D7D46',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#2D7D46',
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
    color: '#1A1A1A',
  },
  userTitle: {
    fontSize: 13,
    color: '#2D7D46',
    marginTop: 2,
  },
  expBar: {
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  expFill: {
    width: '62.5%',
    height: '100%',
    backgroundColor: '#2D7D46',
    borderRadius: 4,
  },
  expText: {
    position: 'absolute',
    right: 4,
    top: -2,
    fontSize: 9,
    color: '#666',
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF8F2',
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
    borderColor: '#2D7D46',
  },
  agentAvatarImg: {
    width: '100%',
    height: '100%',
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  agentStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D7D46',
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
    color: '#1A1A1A',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 13,
    color: '#2D7D46',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 56) / 4,
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
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: '#999',
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsTitle: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#E85D4C',
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
    color: '#CCC',
  },
});
