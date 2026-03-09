import { useAuth } from '@/contexts/auth-context';
import { groupApi, type Group } from '@/services/api';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'done':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Selesai', icon: '✅' };
    case 'cancelled':
      return { bg: '#F1F5F9', text: '#64748B', label: 'Dibatalkan', icon: '❌' };
    case 'paid':
      return { bg: '#DBEAFE', text: '#1E40AF', label: 'Sudah Bayar', icon: '💰' };
    case 'shipped':
      return { bg: '#EDE9FE', text: '#6D28D9', label: 'Dikirim', icon: '📦' };
    case 'received':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Diterima', icon: '✅' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Pending', icon: '⏳' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: status, icon: '📋' };
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatPrice = (price: number) => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

type FilterType = 'semua' | 'done' | 'cancelled';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState<FilterType>('semua');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return <Redirect href="/login" />;

  const fetchGroups = async () => {
    try {
      const data = await groupApi.list();
      // Hanya transaksi yang sudah selesai atau dibatalkan (history)
      setGroups(data.filter((g) => g.status === 'done' || g.status === 'cancelled'));
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const filteredGroups =
    filter === 'semua'
      ? groups
      : groups.filter((g) => g.status === filter);

  const doneCount = groups.filter((g) => g.status === 'done').length;
  const cancelledCount = groups.filter((g) => g.status === 'cancelled').length;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'semua', label: `Semua (${groups.length})` },
    { key: 'done', label: `Selesai (${doneCount})` },
    { key: 'cancelled', label: `Batal (${cancelledCount})` },
  ];

  const getMember = (group: Group, role: string) => {
    const m = group.members.find((m) => m.role === role);
    return m ? m.user.displayName || m.user.username : '-';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          {user.role === 'admin' ? 'Semua transaksi selesai/batal' : 'Riwayat transaksi Anda'}
        </Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{groups.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{doneCount}</Text>
          <Text style={styles.summaryLabel}>Selesai</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{cancelledCount}</Text>
          <Text style={styles.summaryLabel}>Batal</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const statusStyle = getStatusStyle(group.status);
            return (
              <TouchableOpacity
                key={group._id}
                style={styles.txCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: group._id, name: group.itemName },
                  })
                }
              >
                <View style={styles.txHeader}>
                  <View style={styles.txIdContainer}>
                    <Text style={styles.txId}>{group._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.txDate}>{formatDate(group.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={{ fontSize: 12 }}>{statusStyle.icon}</Text>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.txTitle}>{group.itemName}</Text>
                <Text style={styles.txAmount}>{formatPrice(group.itemPrice)}</Text>

                <View style={styles.txDetails}>
                  <View style={styles.txDetailItem}>
                    <Text style={styles.txDetailLabel}>Buyer</Text>
                    <Text style={styles.txDetailValue}>{getMember(group, 'buyer')}</Text>
                  </View>
                  <View style={styles.txDetailItem}>
                    <Text style={styles.txDetailLabel}>Seller</Text>
                    <Text style={styles.txDetailValue}>{getMember(group, 'seller')}</Text>
                  </View>
                  {user.role === 'admin' && (
                    <View style={styles.txDetailItem}>
                      <Text style={styles.txDetailLabel}>Fee</Text>
                      <Text style={[styles.txDetailValue, { color: '#10B981' }]}>
                        {group.status === 'cancelled' ? '-' : formatPrice(group.fee)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txIdContainer: {},
  txId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  txDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  txTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  txAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 12,
  },
  txDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 16,
  },
  txDetailItem: {
    flex: 1,
  },
  txDetailLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txDetailValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
