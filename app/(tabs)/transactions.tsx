import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_TRANSACTIONS = [
  {
    id: 'TRX-001',
    title: 'iPhone 15 Pro Max',
    amount: 'Rp 18.500.000',
    buyer: 'alex_buyer',
    seller: 'bob_seller',
    status: 'selesai',
    date: '5 Mar 2026',
    fee: 'Rp 185.000',
  },
  {
    id: 'TRX-002',
    title: 'MacBook Air M2',
    amount: 'Rp 15.000.000',
    buyer: 'carol_buyer',
    seller: 'dave_seller',
    status: 'proses',
    date: '5 Mar 2026',
    fee: 'Rp 150.000',
  },
  {
    id: 'TRX-003',
    title: 'PS5 Digital Edition',
    amount: 'Rp 6.500.000',
    buyer: 'eve_buyer',
    seller: 'frank_seller',
    status: 'pending',
    date: '4 Mar 2026',
    fee: 'Rp 65.000',
  },
  {
    id: 'TRX-004',
    title: 'Samsung S24 Ultra',
    amount: 'Rp 17.000.000',
    buyer: 'grace_buyer',
    seller: 'hank_seller',
    status: 'selesai',
    date: '3 Mar 2026',
    fee: 'Rp 170.000',
  },
  {
    id: 'TRX-005',
    title: 'Nintendo Switch OLED',
    amount: 'Rp 4.200.000',
    buyer: 'user123',
    seller: 'ian_seller',
    status: 'selesai',
    date: '1 Mar 2026',
    fee: 'Rp 42.000',
  },
  {
    id: 'TRX-006',
    title: 'iPad Pro M4',
    amount: 'Rp 19.000.000',
    buyer: 'jack_buyer',
    seller: 'kim_seller',
    status: 'batal',
    date: '28 Feb 2026',
    fee: '-',
  },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'selesai':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Selesai', icon: '✅' };
    case 'proses':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Dalam Proses', icon: '🔄' };
    case 'pending':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Pending', icon: '⏳' };
    case 'batal':
      return { bg: '#F1F5F9', text: '#64748B', label: 'Dibatalkan', icon: '❌' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: status, icon: '📋' };
  }
};

type FilterType = 'semua' | 'proses' | 'selesai' | 'pending' | 'batal';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<FilterType>('semua');

  if (!user) return <Redirect href="/login" />;

  const filteredTransactions =
    filter === 'semua'
      ? ALL_TRANSACTIONS
      : ALL_TRANSACTIONS.filter((t) => t.status === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'semua', label: 'Semua' },
    { key: 'proses', label: 'Proses' },
    { key: 'pending', label: 'Pending' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'batal', label: 'Batal' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          {user.role === 'admin' ? 'Semua transaksi' : 'Transaksi Anda'}
        </Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {ALL_TRANSACTIONS.filter((t) => t.status === 'selesai').length}
          </Text>
          <Text style={styles.summaryLabel}>Selesai</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {ALL_TRANSACTIONS.filter((t) => t.status === 'proses').length}
          </Text>
          <Text style={styles.summaryLabel}>Proses</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {ALL_TRANSACTIONS.filter((t) => t.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
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
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredTransactions.map((tx) => {
          const statusStyle = getStatusStyle(tx.status);
          return (
            <TouchableOpacity key={tx.id} style={styles.txCard} activeOpacity={0.7}>
              <View style={styles.txHeader}>
                <View style={styles.txIdContainer}>
                  <Text style={styles.txId}>{tx.id}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={{ fontSize: 12 }}>{statusStyle.icon}</Text>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txAmount}>{tx.amount}</Text>

              <View style={styles.txDetails}>
                <View style={styles.txDetailItem}>
                  <Text style={styles.txDetailLabel}>Buyer</Text>
                  <Text style={styles.txDetailValue}>@{tx.buyer}</Text>
                </View>
                <View style={styles.txDetailItem}>
                  <Text style={styles.txDetailLabel}>Seller</Text>
                  <Text style={styles.txDetailValue}>@{tx.seller}</Text>
                </View>
                {user.role === 'admin' && (
                  <View style={styles.txDetailItem}>
                    <Text style={styles.txDetailLabel}>Fee</Text>
                    <Text style={[styles.txDetailValue, { color: '#10B981' }]}>
                      {tx.fee}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
});
