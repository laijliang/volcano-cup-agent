import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner, useToast } from '@/heroui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const { toast } = useToast();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      toast.show({ label: '请输入手机号', variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await login(trimmedPhone, name.trim() || undefined);
    } catch (e: any) {
      toast.show({ label: '登录失败', description: e?.message || '请稍后重试', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor={t.bg} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          {/* Logo 区域 */}
          <View style={styles.logoArea}>
            <LinearGradient
              colors={['#2D7D46', '#3FB950']}
              style={styles.logoCircle}
            >
              <Text style={styles.logoEmoji}>🗺️</Text>
            </LinearGradient>
            <Text style={[styles.appName, { color: t.text }]}>赛博派蒙</Text>
            <Text style={[styles.appSubtitle, { color: t.textSecondary }]}>
              探索广州，发现未知的惊喜
            </Text>
          </View>

          {/* 表单 */}
          <View style={styles.form}>
            <View style={[styles.inputWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>手机号</Text>
              <TextInput
                style={[styles.input, { color: t.text }]}
                placeholder="请输入手机号"
                placeholderTextColor={t.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
                autoFocus
                editable={!loading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>昵称（选填）</Text>
              <TextInput
                style={[styles.input, { color: t.text }]}
                placeholder="给自己取个名字吧"
                placeholderTextColor={t.textTertiary}
                value={name}
                onChangeText={setName}
                maxLength={30}
                editable={!loading}
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#6B7280', '#9CA3AF'] : ['#2D7D46', '#3FB950']}
                style={styles.loginBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Spinner size="sm" color="#FFF" />
                ) : (
                  <Text style={styles.loginBtnText}>进入探索</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 底部提示 */}
          <Text style={[styles.footerHint, { color: t.textTertiary }]}>
            首次输入手机号将自动注册账号
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 15,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    fontSize: 17,
    paddingVertical: 4,
    outline: 'none',
  },
  loginBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerHint: {
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
  },
});
