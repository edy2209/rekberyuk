import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { EventSubscription } from 'expo-modules-core';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { SocketProvider, useSocket } from '@/contexts/socket-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerForPushNotificationsAsync, showLocalNotification } from '@/utils/push-notifications';
import SplashScreen from './splash';

// Notif handler: tampilkan notif saat app di foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Setup Android notification channel dengan custom sound
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rekber-messages', {
      name: 'Pesan RekberYuk',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'notif.wav',
      enableLights: true,
      lightColor: '#6366F1',
      enableVibrate: true,
      showBadge: true,
    });
  }
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { loading, user } = useAuth();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  // Setup notification channel + register push token saat user login
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync();
    }
  }, [user]);

  // Listener: notif masuk (foreground) & tap notif (background/killed)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Notification received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'new_message' && data?.groupId) {
        router.push(`/chat/${data.groupId}?name=${encodeURIComponent(String(data.groupName || 'Chat'))}`);
      } else if (data?.type === 'group_invite' && data?.groupId) {
        router.push(`/chat/${data.groupId}?name=${encodeURIComponent(String(data.groupName || 'Grup Baru'))}`);
      } else if (data?.type === 'status_update' && data?.groupId) {
        router.push(`/chat/${data.groupId}?name=${encodeURIComponent(String(data.groupName || 'Chat'))}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SocketProvider isLoggedIn={!!user}>
      <SocketNotificationListener />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-group"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SocketProvider>
  );
}

// Komponen untuk listen socket notif → trigger local notification (seperti WA)
function SocketNotificationListener() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: {
      title?: string;
      message?: string;
      type?: string;
      groupId?: string;
      groupName?: string;
    }) => {
      const title = data.title || 'RekberYuk';
      const body = data.message || 'Kamu punya notifikasi baru';
      showLocalNotification(title, body, {
        type: data.type,
        groupId: data.groupId,
        groupName: data.groupName,
      });
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
