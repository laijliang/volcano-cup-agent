import { useState, useRef, useEffect } from 'react';
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
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { sendChatMessage, createCheckin, getStats } from '@/services/api';

const { width } = Dimensions.get('window');

// 初始对话数据
const initialMessages = [
  {
    id: '1',
    type: 'agent' as const,
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
  { id: 'checkin', icon: 'location-dot', label: '打卡', color: '#2D7D46' },
  { id: 'camera', icon: 'camera', label: '拍照', color: '#E85D4C' },
  { id: 'voice', icon: 'microphone', label: '语音', color: '#D4A574' },
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
    if (!selectedImage) return;
    
    setIsCheckingIn(true);
    try {
      // 模拟打卡（实际应用中会选择具体的锚点）
      await createCheckin('1', selectedImage, '越秀区');
      Alert.alert('打卡成功！', '恭喜你完成了这个地点的打卡，继续探索吧～');
      setCheckinModalVisible(false);
      setSelectedImage(null);
      loadStats();
    } catch (error) {
      Alert.alert('打卡失败', '请稍后重试');
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
        Alert.alert('语音功能', '语音功能即将上线，敬请期待～');
        break;
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 阿穗形象区 */}
        <View style={[styles.agentHeader, { paddingTop: insets.top + 10 }]}>
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
          {stats && (
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
          )}
        </View>

        {/* 今日任务卡片 */}
        <View style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskBadge}>
              <FontAwesome6 name="flag" size={12} color="#2D7D46" />
              <Text style={styles.taskBadgeText}>今日任务</Text>
            </View>
            <Text style={styles.taskReward}>{todayTask.reward}</Text>
          </View>
          <Text style={styles.taskTitle}>{todayTask.title}</Text>
          <Text style={styles.taskSubtitle}>{todayTask.subtitle}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
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
                <ActivityIndicator size="small" color="#2D7D46" />
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
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <FontAwesome6 name={action.icon as any} size={18} color={action.color} />
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
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <FontAwesome6 name="paper-plane" size={18} color="#FFF" />
              )}
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
                确认在当前位置进行打卡？这将消耗一次打卡次数哦～
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F2',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2D7D46',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  agentTextContainer: {
    marginLeft: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  agentStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D7D46',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  taskCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskBadgeText: {
    fontSize: 11,
    color: '#2D7D46',
    fontWeight: '600',
    marginLeft: 4,
  },
  taskReward: {
    fontSize: 11,
    color: '#D4A574',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2D7D46',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    marginTop: 16,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  agentBubble: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: width * 0.7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: '#2D7D46',
    borderBottomRightRadius: 4,
  },
  agentMessage: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFF',
  },
  agentText: {
    color: '#1A1A1A',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  agentTime: {
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 20,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D7D46',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
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
