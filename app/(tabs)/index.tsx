import { useAuth } from '@/contexts/auth-context';
import { groupApi, notifApi, type Group } from '@/services/api';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'done':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' };
    case 'cancelled':
      return { bg: '#F1F5F9', text: '#64748B', label: 'Dibatalkan' };
    case 'paid':
      return { bg: '#DBEAFE', text: '#1E40AF', label: 'Sudah Bayar' };
    case 'shipped':
      return { bg: '#EDE9FE', text: '#6D28D9', label: 'Dikirim' };
    case 'received':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Diterima' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: status };
  }
};

const formatPrice = (price: number) => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffH < 1) return 'Baru saja';
  if (diffH < 24) return `${diffH} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  if (!user) return <Redirect href="/login" />;

  const fetchData = async () => {
    try {
      const [data, notifRes] = await Promise.all([
        groupApi.list(),
        notifApi.unreadCount().catch(() => ({ unreadCount: 0 })),
      ]);
      setGroups(data);
      setUnreadCount(notifRes.unreadCount);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalCount = groups.length;
  const activeCount = groups.filter((g) => !['done', 'cancelled'].includes(g.status)).length;
  const doneCount = groups.filter((g) => g.status === 'done').length;
  const cancelledCount = groups.filter((g) => g.status === 'cancelled').length;

  const recentGroups = [...groups]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const adminStats = [
    { label: 'Total Transaksi', value: String(totalCount), icon: '📦', color: '#6366F1' },
    { label: 'Berjalan', value: String(activeCount), icon: '🔄', color: '#F59E0B' },
    { label: 'Selesai', value: String(doneCount), icon: '✅', color: '#10B981' },
    { label: 'Batal', value: String(cancelledCount), icon: '❌', color: '#EF4444' },
  ];

  const clientStats = [
    { label: 'Total Transaksi', value: String(totalCount), icon: '📦', color: '#6366F1' },
    { label: 'Berjalan', value: String(activeCount), icon: '🔄', color: '#F59E0B' },
    { label: 'Selesai', value: String(doneCount), icon: '✅', color: '#10B981' },
    { label: 'Batal', value: String(cancelledCount), icon: '❌', color: '#EF4444' },
  ];

  const stats = user.role === 'admin' ? adminStats : clientStats;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Halo, {user.displayName}! 👋</Text>
            <TouchableOpacity
              style={styles.idRow}
              onPress={async () => {
                await Clipboard.setStringAsync(user.id);
                Alert.alert('Tersalin!', 'ID kamu berhasil disalin');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.idText}>ID: {user.id}</Text>
              <Text style={styles.idCopy}>📋</Text>
            </TouchableOpacity>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'admin' ? '🛡️ Administrator' : '👤 Client'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellContainer}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user.avatar}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        {user.role === 'user' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/add-group')}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={styles.actionIcon}>➕</Text>
                </View>
                <Text style={styles.actionText}>Buat{'\n'}Transaksi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.actionIcon}>💬</Text>
                </View>
                <Text style={styles.actionText}>Chat{'\n'}Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.actionIcon}>📋</Text>
                </View>
                <Text style={styles.actionText}>Riwayat{'\n'}Transaksi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.actionIcon}>❓</Text>
                </View>
                <Text style={styles.actionText}>Bantuan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Admin Quick Actions */}
        {user.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.actionIcon}>💬</Text>
                </View>
                <Text style={styles.actionText}>Chat{'\n'}Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.actionIcon}>⚠️</Text>
                </View>
                <Text style={styles.actionText}>Pending{'\n'}Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.actionIcon}>💸</Text>
                </View>
                <Text style={styles.actionText}>Cairkan{'\n'}Dana</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.actionIcon}>📊</Text>
                </View>
                <Text style={styles.actionText}>Laporan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ paddingVertical: 20 }} />
          ) : recentGroups.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>Belum ada transaksi</Text>
            </View>
          ) : (
            recentGroups.map((group) => {
              const statusStyle = getStatusStyle(group.status);
              return (
                <TouchableOpacity
                  key={group._id}
                  style={styles.transactionCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/chat/[id]',
                      params: { id: group._id, name: group.itemName },
                    })
                  }
                >
                  <View style={styles.txIconContainer}>
                    <Text style={styles.txIcon}>📦</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{group.itemName}</Text>
                    <Text style={styles.txAmount}>{formatPrice(group.itemPrice)}</Text>
                    <Text style={styles.txDate}>{formatTime(group.updatedAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

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
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 6,
    gap: 6,
  },
  idText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  idCopy: {
    fontSize: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  avatarText: {
    fontSize: 26,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    flexGrow: 1,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 26,
  },
  actionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txIcon: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  emptyTxText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
