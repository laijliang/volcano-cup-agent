import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { sendChatMessage, createCheckin, getStats, type ChatMessage } from '@/services/api';
import { Spinner, Dialog, Skeleton, useToast } from '@/heroui';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width } = Dimensions.get('window');

// 初始对话数据
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'agent',
    content: '旅行者！早上好呀～今天天气真不错，要不要出去走走探索一下广州？',
    time: '08:30',
  },
];

// 今日任务示例
const todayTask = {
  id: '1',
  title: '五羊圣地',
  subtitle: '探索越秀区的第一个锚点',
  progress: 2,
  total: 5,
  reward: '解锁五羊石像区域',
};

// 快捷操作
const quickActions = [
  { id: 'checkin', icon: 'location-dot', label: '打卡', colorKey: 'primary' },
  { id: 'camera', icon: 'camera', label: '拍照', colorKey: 'danger' },
  { id: 'voice', icon: 'microphone', label: '语音', colorKey: 'gold' },
];

interface Stats {
  total_checkins: number;
  checked_anchors: number;
  total_anchors: number;
  unlocked_regions: number;
  total_regions: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const t = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // 打卡相关状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    // 获取统计数据
    loadStats();

    // 滚动到底部
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputText.trim(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 调用后端API
      const response = await sendChatMessage(userMessage.content);

      const agentMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent' as const,
        content: response.reply,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      // 如果API调用失败，使用模拟回复
      const replies = [
        '这个想法太棒了！让我帮你规划一下路线吧～',
        '哇，原来你想去这里！那边确实有很多有趣的打卡点呢！',
        '好呀好呀！我们一起去探索吧，我已经迫不及待啦！',
        '旅行者，你知道吗？广州有很多隐藏的美食宝藏等你去发现哦！',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const agentMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent' as const,
        content: randomReply,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, agentMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 拍照功能
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.show({ label: '需要相机权限', description: '请在设置中允许相机权限才能拍照哦～', variant: 'warning' });
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

  // 确认打卡
  const handleConfirmCheckin = async () => {
    if (!selectedImage) return;

    setIsCheckingIn(true);
    try {
      // 模拟打卡（实际应用中会选择具体的锚点）
      await createCheckin('1', selectedImage, '越秀区');
      toast.show({ label: '打卡成功！', description: '恭喜你完成了这个地点的打卡，继续探索吧～', variant: 'success' });
      setCheckinModalVisible(false);
      setSelectedImage(null);
      loadStats();
    } catch (error) {
      toast.show({ label: '打卡失败', description: '请稍后重试', variant: 'danger' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 快捷操作处理
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'camera':
        handleTakePhoto();
        break;
      case 'checkin':
        handleSelectFromGallery();
        break;
      case 'voice':
        toast.show({ label: '语音功能', description: '语音功能即将上线，敬请期待～' });
        break;
    }
  };

  const actionColorMap: Record<string, string> = { primary: t.primary, danger: t.danger, gold: t.gold };

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  // 顶部区域 - 添加渐变效果
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: t.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    // 添加渐变装饰
    position: 'relative',
    overflow: 'hidden',
  },
  // 渐变装饰条
  gradientDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: 'hidden',
  },
  gradientDecorFill: {
    flex: 1,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: t.primary,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: t.primary,
    borderWidth: 3,
    borderColor: t.surface,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  agentTextContainer: {
    marginLeft: 14,
  },
  agentName: {
    fontSize: 20,
    fontWeight: '700',
    color: t.text,
    letterSpacing: 0.5,
  },
  agentStatus: {
    fontSize: 13,
    color: t.primary,
    marginTop: 3,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: t.primary,
  },
  statLabel: {
    fontSize: 11,
    color: t.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: t.primaryBorder,
    marginHorizontal: 6,
  },
  // 任务卡片 - 添加渐变边框效果
  taskCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    backgroundColor: t.surface,
    borderRadius: 24,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: t.primaryLight,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCardDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderBottomLeftRadius: 50,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  taskBadgeText: {
    fontSize: 12,
    color: t.primary,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  taskReward: {
    fontSize: 11,
    color: t.gold,
    fontWeight: '600',
    backgroundColor: t.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: t.text,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  taskSubtitle: {
    fontSize: 14,
    color: t.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: t.primaryBg,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.primaryBorder,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 13,
    color: t.primary,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    marginTop: 20,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  // 消息气泡 - 优化圆角和阴影
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  agentBubble: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: t.primaryLight,
  },
  messageContent: {
    maxWidth: width * 0.72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: t.primary,
    borderBottomRightRadius: 6,
  },
  agentMessage: {
    backgroundColor: t.surface,
    borderBottomLeftRadius: 6,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: t.primaryLight,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  agentText: {
    color: t.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  userTime: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  agentTime: {
    color: t.textTertiary,
  },
  // 快捷操作 - 现代化设计
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 24,
  },
  quickActionBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: t.surface,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: t.border,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    color: t.text,
    fontWeight: '600',
  },
  // 输入区域 - 现代化设计
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: t.surface,
    borderTopWidth: 1,
    borderTopColor: t.border,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surfaceSecondary,
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 52,
    borderWidth: 1,
    borderColor: t.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: t.text,
    paddingVertical: 0,
  },
  sendButtonGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginLeft: 10,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  sendButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: t.textTertiary,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: t.border,
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
    backgroundColor: t.borderLight,
    borderWidth: 1,
    borderColor: t.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: t.textSecondary,
    fontWeight: '600',
  },
  confirmButtonGradient: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  }), [t]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 阿穗形象区 */}
        <View style={[styles.agentHeader, { paddingTop: 10 }]}>
          <View style={styles.gradientDecor}>
            <LinearGradient
              colors={['rgba(45,125,70,0.15)', 'rgba(45,125,70,0.04)', 'transparent']}
              locations={[0, 0.4, 0.7]}
              style={styles.gradientDecorFill}
            />
          </View>
          <View style={styles.agentInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }}
                style={styles.avatar}
              />
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.agentTextContainer}>
              <Text style={styles.agentName}>阿穗</Text>
              <Text style={styles.agentStatus}>在线 · 陪你探索广州</Text>
            </View>
          </View>
          {/* 统计数据 */}
          {stats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.checked_anchors}/{stats.total_anchors}</Text>
                <Text style={styles.statLabel}>打卡</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.unlocked_regions}/{stats.total_regions}</Text>
                <Text style={styles.statLabel}>区域</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <Skeleton variant="shimmer" style={{ width: 56, height: 36, borderRadius: 8 }} />
              <View style={styles.statDivider} />
              <Skeleton variant="shimmer" style={{ width: 56, height: 36, borderRadius: 8 }} />
            </View>
          )}
        </View>

        {/* 今日任务卡片 */}
        <View style={styles.taskCard}>
          <LinearGradient
            colors={['rgba(45,125,70,0.12)', 'rgba(45,125,70,0.03)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.taskCardDecor}
          />
          <View style={styles.taskHeader}>
            <View style={styles.taskBadge}>
              <FontAwesome6 name="flag" size={12} color={t.primary} />
              <Text style={styles.taskBadgeText}>今日任务</Text>
            </View>
            <Text style={styles.taskReward}>{todayTask.reward}</Text>
          </View>
          <Text style={styles.taskTitle}>{todayTask.title}</Text>
          <Text style={styles.taskSubtitle}>{todayTask.subtitle}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[t.primary, '#4DAE60', '#5EBE70']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${(todayTask.progress / todayTask.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {todayTask.progress}/{todayTask.total}
            </Text>
          </View>
        </View>

        {/* 对话区域 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.agentBubble,
              ]}
            >
              {msg.type === 'agent' && (
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop' }}
                  style={styles.msgAvatar}
                />
              )}
              <View
                style={[
                  styles.messageContent,
                  msg.type === 'user' ? styles.userMessage : styles.agentMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.type === 'user' ? styles.userText : styles.agentText,
                  ]}
                >
                  {msg.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    msg.type === 'user' ? styles.userTime : styles.agentTime,
                  ]}
                >
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}

          {/* 加载指示器 */}
          {isLoading && (
            <View style={[styles.messageBubble, styles.agentBubble]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop' }}
                style={styles.msgAvatar}
              />
              <View style={[styles.messageContent, styles.agentMessage]}>
                <Spinner size="sm" color={t.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 快捷操作栏 */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionBtn}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: actionColorMap[action.colorKey] + '25' }]}>
                <FontAwesome6 name={action.icon as any} size={18} color={actionColorMap[action.colorKey]} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 输入区域 */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="和阿穗聊聊天..."
              placeholderTextColor={t.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!isLoading}
            />
            <LinearGradient
              colors={[t.primary, '#4DAE60']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <Spinner size="sm" color="#FFF" />
                ) : (
                  <FontAwesome6 name="paper-plane" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </LinearGradient>
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
                确认在当前位置进行打卡？这将消耗一次打卡次数哦～
              </Dialog.Description>

              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCheckinModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <LinearGradient
                  colors={[t.primary, '#4DAE60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleConfirmCheckin}
                    disabled={isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <Spinner size="sm" color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>确认打卡</Text>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </KeyboardAvoidingView>
    </Screen>
  );
}
