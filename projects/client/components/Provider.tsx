import { AuthProvider } from '@/contexts/AuthContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { WebOnlyPrettyScrollbar } from './PrettyScrollbar'
import { HeroUINativeProvider } from '@/heroui';

function Provider({ children }: { children: ReactNode }) {
  return <WebOnlyColorSchemeUpdater>
    <WebOnlyPrettyScrollbar>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <HeroUINativeProvider config={{
            toast: Platform.OS === 'web' ? {
              defaultProps: { animation: 'disable-all' },
            } : undefined,
          }}>
            {children}
          </HeroUINativeProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </WebOnlyPrettyScrollbar>
  </WebOnlyColorSchemeUpdater>
}

export {
  Provider,
}
