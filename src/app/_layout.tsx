import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNetInfo } from '@react-native-community/netinfo';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { resumePendingAction } from '@/features/posts/actions';
import { queryClient } from '@/lib/queryClient';
import { usePending } from '@/store/pending';
import { GatherThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready, session, profile } = useAuth();
  const segments = useSegments();
  const theme = useTheme();
  const net = useNetInfo();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const root = segments[0];
    if (session && !profile) return;
    if (session && profile && profile.onboardingStep !== 'done') {
      const path = profile.onboardingStep === 'interests' ? '/(onboarding)/interests' : '/(onboarding)/username';
      if (root !== '(onboarding)') router.replace(path);
      return;
    }
    if (session && profile?.onboardingStep === 'done' && (root === '(auth)' || root === '(onboarding)')) {
      const destination = (usePending.getState().returnTo ?? '/') as Href;
      router.replace(destination);
      void resumePendingAction();
    }
  }, [ready, session, profile, segments]);

  if (!ready) return null;
  if (net.isConnected === false) {
    return (
      <View style={{ backgroundColor: theme.colors.highlight, paddingVertical: 6, paddingHorizontal: 16 }}>
        <Text style={[theme.type.caption, { color: theme.colors.text, textAlign: 'center' }]}>You’re offline. You can keep reading what has already loaded.</Text>
      </View>
    );
  }
  return null;
}

function Navigation() {
  const theme = useTheme();
  const navigationTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navigationTheme, colors: { ...navigationTheme.colors, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.text, border: theme.colors.border, primary: theme.colors.primary } }}>
      <Gate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
        <Stack.Screen name="post/[id]/index" />
        <Stack.Screen name="post/[id]/replies/[commentId]" />
        <Stack.Screen name="community/[slug]" />
        <Stack.Screen name="new-community" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="scripture" options={{ presentation: 'modal' }} />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/edit-profile" />
        <Stack.Screen name="settings/saved" />
        <Stack.Screen name="settings/communities" />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/sabbath" />
        <Stack.Screen name="settings/blocked" />
        <Stack.Screen name="settings/guidelines" />
        <Stack.Screen name="settings/delete-account" />
        <Stack.Screen name="moderation" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GatherThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </GatherThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
