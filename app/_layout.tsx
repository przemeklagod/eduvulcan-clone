import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AccountsProvider } from '@/src/auth/accountsContext';
import { queryClient } from '@/src/data/queryClient';
import { checkForUpdates } from '@/src/notifications/checkForUpdates';
import { registerBackgroundCheckTask, requestNotificationPermissions } from '@/src/notifications/setup';
import { ErrorBoundary } from '@/src/ui/ErrorBoundary';

/**
 * iOS's background task runs on its own schedule, often much less often than
 * requested (see setup.ts) - checking on every foreground is what makes new
 * grades/messages/notes actually show up promptly in practice.
 */
function useCheckForUpdatesOnForeground() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    requestNotificationPermissions().catch((e) => console.error('Notification permission request failed', e));
    registerBackgroundCheckTask().catch((e) => console.error('Background task registration failed', e));
    checkForUpdates().catch((e) => console.error('Initial update check failed', e));

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current !== 'active' && nextState === 'active') {
        checkForUpdates().catch((e) => console.error('Foreground update check failed', e));
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useCheckForUpdatesOnForeground();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AccountsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AccountsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
