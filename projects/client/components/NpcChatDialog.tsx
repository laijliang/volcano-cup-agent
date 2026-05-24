import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Dialog } from '@/heroui';
import { FontAwesome6 } from '@expo/vector-icons';
import { sendNpcMessage } from '@/services/api';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spinner } from '@/heroui';

interface NpcMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  time: string;
}

interface NpcChatDialogProps {
  open: boolean;
  onClose: () => void;
  npcId: string;
  npcName: string;
  anchorName?: string;
}

export default function NpcChatDialog({
  open,
  onClose,
  npcId,
  npcName,
  anchorName,
}: NpcChatDialogProps) {
  const t = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<NpcMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dialogOpenedRef = useRef(false);

  // 首次打开时插入 NPC 开场白
  useEffect(() => {
    if (open && !dialogOpenedRef.current) {
      dialogOpenedRef.current = true;
      const greeting = anchorName
        ? `靓仔/靓女，你嚟咗「${anchorName}」啊？食咗饭未呀？我系老广阿伯，呢间店我食咗几十年啦！`
        : `靓仔/靓女，食咗饭未呀？我系老广阿伯，广州啲美食我最熟啦！`;
      setMessages([
        {
          id: Date.now().toString(),
          type: 'agent',
          content: greeting,
          time: getTimeStr(),
        },
      ]);
    }
    if (!open) {
      dialogOpenedRef.current = false;
      setMessages([]);
    }
  }, [open]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: NpcMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      time: getTimeStr(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const resp = await sendNpcMessage(text, npcId);
      const agentMsg: NpcMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: resp.reply,
        time: getTimeStr(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const errMsg: NpcMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: '……（老伯暂时不想理你）',
        time: getTimeStr(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content style={[styles.dialog, { backgroundColor: t.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: t.gold + '30' }]}>
                <Text style={styles.avatarEmoji}>👴</Text>
              </View>
              <View>
                <Text style={[styles.headerName, { color: t.text }]}>{npcName}</Text>
                <Text style={[styles.headerStatus, { color: t.textTertiary }]}>地道广州人</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome6 name="xmark" size={18} color={t.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.msgList}
            contentContainerStyle={styles.msgContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.type === 'user' ? styles.userBubble : styles.agentBubble,
                ]}
              >
                {msg.type === 'agent' && (
                  <View style={[styles.msgAvatar, { backgroundColor: t.gold + '30' }]}>
                    <Text style={styles.msgAvatarEmoji}>👴</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.msgBody,
                    msg.type === 'user'
                      ? [styles.userBody, { backgroundColor: t.primary }]
                      : [styles.agentBody, { backgroundColor: t.surface, borderColor: t.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      { color: msg.type === 'user' ? t.textInverse : t.text },
                    ]}
                  >
                    {msg.content}
                  </Text>
                  <Text
                    style={[
                      styles.msgTime,
                      { color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : t.textTertiary },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.bubble, styles.agentBubble]}>
                <View style={[styles.msgAvatar, { backgroundColor: t.gold + '30' }]}>
                  <Text style={styles.msgAvatarEmoji}>👴</Text>
                </View>
                <View style={[styles.msgBody, styles.agentBody, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <Spinner size="sm" color={t.textTertiary} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputRow, { borderTopColor: t.border, backgroundColor: t.surface }]}>
            <TextInput
              style={[styles.input, { color: t.text, backgroundColor: t.surfaceSecondary }]}
              placeholder="和老伯聊聊..."
              placeholderTextColor={t.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              style={[styles.sendBtn, { backgroundColor: t.gold, opacity: (!inputText.trim() || isLoading) ? 0.4 : 1 }]}
            >
              <FontAwesome6 name="paper-plane" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

function getTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  dialog: {
    height: '80%',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: {
    flex: 1,
  },
  msgContent: {
    padding: 14,
    paddingBottom: 8,
  },
  bubble: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarEmoji: {
    fontSize: 16,
  },
  msgBody: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBody: {
    borderBottomRightRadius: 4,
  },
  agentBody: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  msgTime: {
    fontSize: 11,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    outline: 'none',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
