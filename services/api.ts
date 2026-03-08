import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Ganti IP ini sesuai IP WiFi komputer kamu
const LOCAL_IP = '192.168.100.230';

const BASE_URL = Platform.select({
  android: `http://${LOCAL_IP}:8080/api`,  // HP Android / Emulator
  ios: `http://${LOCAL_IP}:8080/api`,       // iPhone
  default: `http://localhost:8080/api`,     // Web browser
})!;

const TOKEN_KEY = 'rekber_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle response yang bukan JSON (misal HTML error page)
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.ok ? 'Response bukan JSON' : `Server error (${res.status})`
    );
  }

  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status})`);
  }

  return data as T;
}

// ============ AUTH API ============

export interface AuthResponse {
  id: string;
  username: string;
  role: 'user' | 'admin';
  displayName: string;
  avatar: string;
  token: string;
}

export interface MeResponse {
  id: string;
  username: string;
  role: 'user' | 'admin';
  displayName: string;
  avatar: string;
}

export const authApi = {
  register(username: string, password: string, displayName: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    });
  },

  login(username: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  me() {
    return request<MeResponse>('/auth/me', {
      method: 'GET',
    });
  },
};
