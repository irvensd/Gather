import Constants from 'expo-constants';
import {
  AndroidImportance,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  clearLastNotificationResponseAsync,
  getExpoPushTokenAsync,
  getLastNotificationResponseAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type Notification,
} from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { rememberPushToken } from '@/features/notifications/pushToken';
import { getApi } from '@/lib/backend';
import { queryClient } from '@/lib/queryClient';

setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const opened = new Set<string>();

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

function openNotification(notification: Notification) {
  const id = notification.request.identifier;
  if (opened.has(id)) return;
  opened.add(id);
  const postId = notification.request.content.data?.postId;
  if (typeof postId === 'string' && postId.length > 0) router.push(`/post/${postId}`);
  else router.push('/activity');
}

async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('default', {
      name: 'Gather',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#244F46',
    });
  }
  const current = await getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') status = (await requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const id = projectId();
  if (!id) return null;
  const token = await getExpoPushTokenAsync({ projectId: id });
  return token.data;
}

/** Asks for notification permission once someone has an account, and keeps this phone's token on that account. */
export function PushRegistration() {
  const { session, profile } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const received = addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    const openedNotification = addNotificationResponseReceivedListener((event) => {
      openNotification(event.notification);
    });
    void getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openNotification(response.notification);
      void clearLastNotificationResponseAsync();
    });
    return () => {
      received.remove();
      openedNotification.remove();
    };
  }, []);

  useEffect(() => {
    if (!session || profile?.onboardingStep !== 'done') return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await registerForPush();
        if (!token || cancelled) return;
        await (await getApi()).registerPushToken(token);
        if (!cancelled) rememberPushToken(token);
      } catch {
        // A denied permission or a build without push still leaves Activity intact.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, profile?.onboardingStep]);

  return null;
}
