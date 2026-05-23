import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle: any = {
    backgroundColor: background,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
    height: Platform.OS === 'ios' ? 88 : 72,
    // 现代化阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    // 顶部圆角
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // 内边距
    marginHorizontal: 8,
    marginBottom: 8,
  };

  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
      borderRadius: 24,
      marginBottom: 12,
    };
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={24} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '地图',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="map-location" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '任务',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="scroll" size={24} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '日历',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="calendar-days" size={24} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="circle-user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
