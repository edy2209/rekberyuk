import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { groupApi, notifApi, type Group } from '@/services/api';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
    case 'shipped':
      return '#10B981';
    case 'pending':
      return '#F59E0B';
    case 'done':
    case 'cancelled':
      return '#94A3B8';
    default:
      return '#94A3B8';
  }
};

const formatPrice = (price: number) => {
  if (price >= 1_000_000) return `Rp ${(price / 1_000_000).toFixed(1)}jt`;
  if (price >= 1_000) return `Rp ${(price / 1_000).toFixed(0)}rb`;
  return `Rp ${price}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export default function ChatListScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [lastMsgTimeMap, setLastMsgTimeMap] = useState<Record<string, string>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!user) return <Redirect href="/login" />;

  const fetchGroups = async () => {
    try {
      const [data, notifRes] = await Promise.all([
        groupApi.list(),
        notifApi.list(1, 100).catch(() => ({ notifications: [] } as any)),
      ]);
      const active = data.filter((g) => g.status !== 'done' && g.status !== 'cancelled');

      // Fetch pesan terakhir tiap group buat sorting ala WhatsApp
      const msgTimeMap: Record<string, string> = {};
      await Promise.all(
        active.map(async (g) => {
          try {
            const msgRes = await groupApi.getMessages(g._id, 1, 50);
            if (msgRes.messages.length > 0) {
              // Ambil pesan paling baru (createdAt terbesar)
              let latest = msgRes.messages[0].createdAt;
              for (const m of msgRes.messages) {
                if (new Date(m.createdAt).getTime() > new Date(latest).getTime()) {
                  latest = m.createdAt;
                }
              }
              msgTimeMap[g._id] = latest;
            }
          } catch {
            // skip
          }
        })
      );

      // Sort: yang punya pesan terbaru di atas, fallback ke updatedAt
      active.sort((a, b) => {
        const timeA = new Date(msgTimeMap[a._id] || a.updatedAt).getTime();
        const timeB = new Date(msgTimeMap[b._id] || b.updatedAt).getTime();
        return timeB - timeA;
      });

      setGroups(active);
      setLastMsgTimeMap(msgTimeMap);

      // Hitung unread per group
      const map: Record<string, number> = {};
      for (const n of notifRes.notifications || []) {
        if (!n.isRead && n.group) {
          map[n.group] = (map[n.group] || 0) + 1;
        }
      }
      setUnreadMap(map);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  // Socket: refresh list saat ada pesan/notif baru
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => fetchGroups();

    socket.on('new_notification', handleRefresh);
    socket.on('new_message', handleRefresh);

    return () => {
      socket.off('new_notification', handleRefresh);
      socket.off('new_message', handleRefresh);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Chat</Text>
        {user.role === 'user' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-group')}
          >
            <Text style={styles.addButtonText}>+ Grup Baru</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>🔒</Text>
        <Text style={styles.infoText}>
          {user.role === 'admin'
            ? 'Semua chat transaksi client Anda'
            : 'Chat grup rekber Anda dengan admin & seller'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          {groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Tidak ada transaksi aktif</Text>
              {user.role === 'user' && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/add-group')}
                >
                  <Text style={styles.emptyButtonText}>Buat Transaksi Pertama</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            groups.map((group) => (
              <TouchableOpacity
                key={group._id}
                style={styles.chatItem}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: group._id, name: group.itemName },
                  })
                }
              >
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>👥</Text>
                  <View
                    style={[styles.statusDot, { backgroundColor: getStatusColor(group.status) }]}
                  />
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatTopRow}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {group.itemName}
                    </Text>
                    <View style={styles.chatTimeRow}>
                      {unreadMap[group._id] > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{unreadMap[group._id]}</Text>
                        </View>
                      )}
                      <Text style={styles.chatTime}>{formatTime(lastMsgTimeMap[group._id] || group.updatedAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.chatMiddleRow}>
                    <Text style={styles.chatAmount}>{formatPrice(group.itemPrice)}</Text>
                    <Text style={styles.chatMembers}>
                      {group.members.length} anggota
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: getStatusColor(group.status) + '20' }]}>
                      <Text style={[styles.statusChipText, { color: getStatusColor(group.status) }]}>
                        {group.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chatBottomRow}>
                    <Text style={styles.chatLastMessage} numberOfLines={1}>
                      {group.members.map((m) => m.user.displayName).join(', ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    flex: 1,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chatAvatarText: {
    fontSize: 24,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  chatInfo: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chatTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  chatAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  chatMembers: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  chatSender: {
    fontWeight: '600',
    color: '#475569',
  },
  unreadBadge: {
    backgroundColor: '#6366F1',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
