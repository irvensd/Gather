import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNetInfo } from '@react-native-community/netinfo';

import { AppToast } from '@/components/ui/AppToast';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { PushRegistration } from '@/features/notifications/push';
import { resumePendingAction } from '@/features/posts/actions';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/toast';
import { usePending } from '@/store/pending';
import { usePreferences, usePreferencesHydrated } from '@/store/preferences';
import { GatherThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready, session, profile } = useAuth();
  const segments: readonly string[] = useSegments();
  const previousRoot = useRef<string | undefined>(undefined);
  const theme = useTheme();
  const net = useNetInfo();
  const preferencesReady = usePreferencesHydrated();
  const hasSeenWelcome = usePreferences((state) => state.hasSeenWelcome);

  useEffect(() => {
    if (!ready || !preferencesReady) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, preferencesReady]);

  useEffect(() => {
    if (!ready || !preferencesReady) return;
    const root = segments[0];
    if (!session && previousRoot.current === '(auth)' && root !== '(auth)') usePending.getState().clearPending();
    previousRoot.current = root;
    const onWelcome = root === '(onboarding)' && segments[1] === 'welcome';
    if (session && !profile) return;
    if (session && profile && profile.onboardingStep !== 'done') {
      const path = profile.onboardingStep === 'interests' ? '/(onboarding)/interests' : '/(onboarding)/username';
      if (onWelcome || root !== '(onboarding)') router.replace(path);
      return;
    }
    if (session && profile?.onboardingStep === 'done' && (root === '(auth)' || root === '(onboarding)')) {
      const pending = usePending.getState();
      // A brand-new account just finished choosing communities. Do not drop them into
      // creating a community or a post because some earlier tap saved that screen.
      const finishedOnboarding = root === '(onboarding)';
      const destination = (finishedOnboarding ? '/' : (pending.returnTo ?? '/')) as Href;
      if (finishedOnboarding || !pending.action) pending.clearPending();
      if (!finishedOnboarding && !pending.returnTo && router.canGoBack()) router.back();
      else router.dismissTo(destination);
      if (!finishedOnboarding && pending.action) {
        void resumePendingAction().catch(() => useToast.getState().show('Signed in, but your action could not be completed. Please try again.'));
      }
      return;
    }
    if (!session && !hasSeenWelcome && !onWelcome) router.replace('/(onboarding)/welcome');
  }, [ready, preferencesReady, hasSeenWelcome, session, profile, segments]);

  if (!ready) return null;
  if (net.isConnected === false) {
    return (
      <View style={{ backgroundColor: theme.colors.highlight, paddingVertical: 6, paddingHorizontal: 16 }}>
        <Text style={[theme.type.caption, { color: theme.colors.text, textAlign: 'center' }]}>
          You’re offline. You can keep reading what has already loaded.
        </Text>
      </View>
    );
  }
  return null;
}

function Navigation() {
  const theme = useTheme();
  const navigationTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }}
    >
      <View style={{ flex: 1 }}>
        <Gate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="compose" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="post/[id]/index" />
          <Stack.Screen name="post/[id]/replies/[commentId]" />
          <Stack.Screen name="community/[slug]" />
          <Stack.Screen name="new-community" options={{ presentation: 'modal' }} />
          <Stack.Screen name="edit-community" options={{ presentation: 'modal' }} />
          <Stack.Screen name="user/[username]" />
          <Stack.Screen name="scripture" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" />
          <Stack.Screen name="settings/index" />
          <Stack.Screen name="settings/edit-profile" />
          <Stack.Screen name="settings/saved" />
          <Stack.Screen name="settings/communities" />
          <Stack.Screen name="settings/appearance" />
          <Stack.Screen name="settings/notifications" />
          <Stack.Screen name="settings/blocked" />
          <Stack.Screen name="settings/guidelines" />
          <Stack.Screen name="settings/delete-account" />
          <Stack.Screen name="moderation" />
          <Stack.Screen name="reset-password" />
        </Stack>
        <AppToast />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GatherThemeProvider>
          <AuthProvider>
            <PushRegistration />
            <Navigation />
          </AuthProvider>
        </GatherThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
