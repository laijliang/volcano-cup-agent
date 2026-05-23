import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
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
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
    height: Platform.OS === 'ios' ? 85 : 65,
  };

  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
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
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '地图',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="map" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '任务',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="scroll" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '日历',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="calendar-days" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
