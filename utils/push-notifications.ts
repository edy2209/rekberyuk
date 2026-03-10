import { getToken } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

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

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.error('Project ID not found');
    return null;
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    const authToken = await getToken();
    if (!authToken) return null;

    // Kirim token ke backend
    await fetch(`${API_URL}/push/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: pushTokenString }),
    });

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushTokenString);
    console.log('✅ Push token registered:', pushTokenString);
    return pushTokenString;
  } catch (e) {
    console.error('Failed to register push token:', e);
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
