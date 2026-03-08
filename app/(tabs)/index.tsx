import { useAuth } from '@/contexts/auth-context';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADMIN_STATS = [
  { label: 'Total Client', value: '156', icon: '👥', color: '#6366F1' },
  { label: 'Hari Ini', value: '12', icon: '📊', color: '#F59E0B' },
  { label: 'Pending', value: '5', icon: '⏳', color: '#EF4444' },
  { label: 'Selesai', value: '847', icon: '✅', color: '#10B981' },
];

const CLIENT_STATS = [
  { label: 'Total Transaksi', value: '8', icon: '📦', color: '#6366F1' },
  { label: 'Berjalan', value: '2', icon: '🔄', color: '#F59E0B' },
  { label: 'Selesai', value: '6', icon: '✅', color: '#10B981' },
  { label: 'Saldo', value: 'Rp 0', icon: '💰', color: '#8B5CF6' },
];

const RECENT_TRANSACTIONS = [
  { id: '001', title: 'iPhone 15 Pro Max', amount: 'Rp 18.500.000', status: 'selesai', date: '2 jam lalu' },
  { id: '002', title: 'MacBook Air M2', amount: 'Rp 15.000.000', status: 'proses', date: '5 jam lalu' },
  { id: '003', title: 'PS5 Digital Edition', amount: 'Rp 6.500.000', status: 'pending', date: '1 hari lalu' },
  { id: '004', title: 'Samsung S24 Ultra', amount: 'Rp 17.000.000', status: 'selesai', date: '2 hari lalu' },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'selesai':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' };
    case 'proses':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Dalam Proses' };
    case 'pending':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Pending' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: status };
  }
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!user) return <Redirect href="/login" />;

  const stats = user.role === 'admin' ? ADMIN_STATS : CLIENT_STATS;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.avatar}</Text>
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
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {RECENT_TRANSACTIONS.map((tx) => {
            const statusStyle = getStatusStyle(tx.status);
            return (
              <TouchableOpacity key={tx.id} style={styles.transactionCard} activeOpacity={0.7}>
                <View style={styles.txIconContainer}>
                  <Text style={styles.txIcon}>📦</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txAmount}>{tx.amount}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
});
