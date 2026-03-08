import { useAuth } from '@/contexts/auth-context';
import { Redirect, router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADMIN_CHATS = [
  {
    id: 'grp-001',
    name: 'iPhone 15 Pro Max',
    members: ['alex_buyer', 'bob_seller'],
    lastMessage: 'Barang sudah diterima, kondisi oke!',
    lastSender: 'alex_buyer',
    time: '10:32',
    unread: 2,
    status: 'active',
    amount: 'Rp 18.5jt',
  },
  {
    id: 'grp-002',
    name: 'MacBook Air M2',
    members: ['carol_buyer', 'dave_seller'],
    lastMessage: 'Sudah transfer min',
    lastSender: 'carol_buyer',
    time: '09:15',
    unread: 5,
    status: 'active',
    amount: 'Rp 15jt',
  },
  {
    id: 'grp-003',
    name: 'PS5 Digital Edition',
    members: ['eve_buyer', 'frank_seller'],
    lastMessage: 'Halo min, mau rekber dong',
    lastSender: 'eve_buyer',
    time: 'Kemarin',
    unread: 1,
    status: 'pending',
    amount: 'Rp 6.5jt',
  },
  {
    id: 'grp-004',
    name: 'Samsung S24 Ultra',
    members: ['grace_buyer', 'hank_seller'],
    lastMessage: 'Transaksi selesai! Dana diteruskan ke seller 🙏',
    lastSender: 'Admin',
    time: '2 hari lalu',
    unread: 0,
    status: 'done',
    amount: 'Rp 17jt',
  },
];

const CLIENT_CHATS = [
  {
    id: 'grp-001',
    name: 'iPhone 15 Pro Max',
    members: ['Anda', 'bob_seller', 'Admin'],
    lastMessage: 'Dana sudah diterima ✅ Seller, silakan kirim barangnya',
    lastSender: 'Admin',
    time: '10:32',
    unread: 1,
    status: 'active',
    amount: 'Rp 18.5jt',
  },
  {
    id: 'grp-002',
    name: 'MacBook Air M2',
    members: ['Anda', 'dave_seller', 'Admin'],
    lastMessage: 'Baik, silakan buyer transfer ke rekening rekber ya',
    lastSender: 'Admin',
    time: '09:15',
    unread: 3,
    status: 'active',
    amount: 'Rp 15jt',
  },
  {
    id: 'grp-005',
    name: 'Nintendo Switch OLED',
    members: ['Anda', 'ian_seller', 'Admin'],
    lastMessage: 'Transaksi selesai! Terima kasih sudah menggunakan RekberYuk 🙏',
    lastSender: 'Admin',
    time: '3 hari lalu',
    unread: 0,
    status: 'done',
    amount: 'Rp 4.2jt',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#10B981';
    case 'pending':
      return '#F59E0B';
    case 'done':
      return '#94A3B8';
    default:
      return '#94A3B8';
  }
};

export default function ChatListScreen() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/login" />;

  const chats = user.role === 'admin' ? ADMIN_CHATS : CLIENT_CHATS;

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: chat.id, name: chat.name },
              })
            }
          >
            {/* Chat Avatar */}
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>👥</Text>
              <View
                style={[styles.statusDot, { backgroundColor: getStatusColor(chat.status) }]}
              />
            </View>

            {/* Chat Info */}
            <View style={styles.chatInfo}>
              <View style={styles.chatTopRow}>
                <Text style={styles.chatName} numberOfLines={1}>
                  {chat.name}
                </Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <View style={styles.chatMiddleRow}>
                <Text style={styles.chatAmount}>{chat.amount}</Text>
                <Text style={styles.chatMembers}>
                  {chat.members.length} anggota
                </Text>
              </View>
              <View style={styles.chatBottomRow}>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  <Text style={styles.chatSender}>{chat.lastSender}: </Text>
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
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
