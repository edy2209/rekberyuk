import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddGroupScreen() {
  const { user } = useAuth();
  const [userId, setUserId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'ID pengguna harus diisi');
      return;
    }
    if (!itemName.trim()) {
      Alert.alert('Error', 'Nama barang harus diisi');
      return;
    }
    if (!itemPrice.trim()) {
      Alert.alert('Error', 'Harga harus diisi');
      return;
    }

    Alert.alert(
      'Berhasil! 🎉',
      `Grup rekber telah dibuat!\n\n📦 ${itemName}\n💰 ${itemPrice}\n👤 Partner: @${userId}\n\nAdmin akan segera bergabung ke grup chat.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Transaksi Baru</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Masukkan ID pengguna lawan transaksi Anda. Admin RekberYuk akan otomatis bergabung ke
              grup chat untuk mengamankan transaksi.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID Lawan Transaksi</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan username / ID"
                  placeholderTextColor="#94A3B8"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.inputHint}>Contoh: bob_seller, dave_seller</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Barang / Jasa</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>📦</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mis: iPhone 15 Pro Max"
                  placeholderTextColor="#94A3B8"
                  value={itemName}
                  onChangeText={setItemName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Harga</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>Rp</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.inputHint}>Fee rekber: 1% dari total harga</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catatan (opsional)</Text>
              <TextInput
                style={[styles.inputFull, styles.inputMultiline]}
                placeholder="Tambahkan catatan untuk transaksi ini..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Role Selection Info */}
          <View style={styles.roleInfo}>
            <Text style={styles.roleInfoTitle}>Anda bertransaksi sebagai:</Text>
            <View style={styles.roleOptions}>
              <View style={[styles.roleChip, styles.roleChipActive]}>
                <Text style={styles.roleChipIcon}>🛒</Text>
                <Text style={styles.roleChipTextActive}>Buyer</Text>
              </View>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipIcon}>🏪</Text>
                <Text style={styles.roleChipText}>Seller</Text>
              </View>
            </View>
          </View>

          {/* Summary */}
          {itemName && itemPrice ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Ringkasan</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Barang</Text>
                <Text style={styles.summaryValue}>{itemName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Harga</Text>
                <Text style={styles.summaryValue}>Rp {itemPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Partner</Text>
                <Text style={styles.summaryValue}>@{userId || '...'}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Text style={styles.summaryLabel}>Admin</Text>
                <Text style={[styles.summaryValue, { color: '#6366F1' }]}>
                  Auto-assigned
                </Text>
              </View>
            </View>
          ) : null}

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>🤝 Buat Grup Rekber</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {},
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '700',
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  inputFull: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    marginLeft: 4,
  },
  roleInfo: {
    marginTop: 24,
  },
  roleInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  roleChipActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EDE9FE',
  },
  roleChipIcon: {
    fontSize: 18,
  },
  roleChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  createButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
