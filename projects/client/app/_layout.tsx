import { useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { Provider } from '@/components/Provider';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/heroui';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginPage = segments[0] === 'login';

    if (!isAuthenticated && !inLoginPage) {
      router.replace('/login');
    } else if (isAuthenticated && inLoginPage) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: '#FDF8F2' }]}>
        <Text style={styles.splashEmoji}>🗺️</Text>
        <Text style={styles.splashTitle}>赛博派蒙</Text>
        <Spinner size="sm" color="#2D7D46" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider>
      <AuthGate>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false,
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ title: '' }} />
        </Stack>
      </AuthGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D7D46',
  },
});
