import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend deployed di Render
const BASE_URL = 'https://berekberyuk.onrender.com/api';

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

// ============ GROUP API ============

export interface UserSearchResult {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
}

export const userApi = {
  async search(query: string): Promise<UserSearchResult> {
    const data = await request<any>(`/users/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    // Handle berbagai format response: array, {user:...}, {data:...}, atau langsung object
    const user = Array.isArray(data) ? data[0]
      : data?.user ? data.user
      : data?.data ? (Array.isArray(data.data) ? data.data[0] : data.data)
      : data;
    if (!user || !user.username) throw new Error('User tidak ditemukan');
    return user as UserSearchResult;
  },
};

export interface GroupMember {
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
  role: 'buyer' | 'seller' | 'admin';
}

export interface Group {
  _id: string;
  itemName: string;
  itemPrice: number;
  fee: number;
  description?: string;
  status: string;
  createdBy: { _id: string; username: string; displayName: string };
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  _id: string;
  group: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
  text: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: MessageItem[];
  hasMore: boolean;
  total: number;
  page: number;
}

export const groupApi = {
  create(data: {
    partnerUsername: string;
    itemName: string;
    itemPrice: number;
    description?: string;
    creatorRole: 'buyer' | 'seller';
  }) {
    return request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list() {
    return request<Group[]>('/groups', { method: 'GET' });
  },

  detail(id: string) {
    return request<Group>(`/groups/${id}`, { method: 'GET' });
  },

  addMember(groupId: string, userId: string, role: 'buyer' | 'seller') {
    return request<Group>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  removeMember(groupId: string, userId: string) {
    return request<Group>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  updateStatus(groupId: string, status: string) {
    return request<Group>(`/groups/${groupId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getMessages(groupId: string, page = 1, limit = 50) {
    return request<MessagesResponse>(
      `/groups/${groupId}/messages?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  },

  sendMessage(groupId: string, text: string) {
    return request<MessageItem>(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

// ============ NOTIFICATION API ============

export interface NotificationItem {
  _id: string;
  type: 'new_message' | 'group_invite' | 'status_update';
  title: string;
  message: string;
  group: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  total: number;
  page: number;
}

export const notifApi = {
  list(page = 1, limit = 20) {
    return request<NotificationsResponse>(
      `/notifications?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  },

  unreadCount() {
    return request<{ unreadCount: number }>('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markRead(id: string) {
    return request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllRead() {
    return request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  },
};
