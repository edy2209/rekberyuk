import { getToken } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = 'https://berekberyuk.onrender.com/api';
const PUSH_TOKEN_KEY = 'rekber_push_token';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications hanya bisa di device fisik');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Izin notifikasi ditolak');
    return null;
  }

  // Get native FCM token (bukan Expo Push Token)
  try {
    console.log('🔄 Getting native FCM token...');
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const pushTokenString = deviceToken.data as string;
    console.log('🔑 FCM token:', pushTokenString.substring(0, 20) + '...');

    const authToken = await getToken();
    if (!authToken) {
      console.log('❌ No auth token, skip push register');
      return null;
    }

    // Kirim token ke backend
    const response = await fetch(`${API_URL}/push/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: pushTokenString }),
    });

    const resData = await response.json().catch(() => null);
    console.log('📤 Push register response:', response.status, resData);

    if (!response.ok) {
      console.error('❌ Push register failed:', response.status, resData);
      return null;
    }

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushTokenString);
    console.log('✅ FCM token registered successfully');
    return pushTokenString;
  } catch (e) {
    console.error('❌ Failed to register push token:', e);
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const authToken = await getToken();
    const pushToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

    if (authToken && pushToken) {
      await fetch(`${API_URL}/push/unregister`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: pushToken }),
      });
      console.log('✅ Push token unregistered');
    }

    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to unregister push token:', e);
  }
}

// Trigger notifikasi lokal (untuk socket event saat app foreground)
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: Platform.OS === 'android' ? 'notif.wav' : true,
      data: data || {},
      ...(Platform.OS === 'android' && { channelId: 'rekber-messages' }),
    },
    trigger: null, // Langsung tampilkan
  });
}
