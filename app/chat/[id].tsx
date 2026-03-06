import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/auth-context';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  sender: string;
  senderRole: 'admin' | 'buyer' | 'seller';
  text: string;
  time: string;
  isMe: boolean;
}

// === DUMMY BANK ACCOUNTS (nanti dari database) ===
const BANK_ACCOUNTS = [
  { id: '1', bankName: 'BCA', accountNumber: '1234567890', accountName: 'RekberYuk Official', type: 'bank', icon: '🏦' },
  { id: '2', bankName: 'BRI', accountNumber: '0987654321', accountName: 'RekberYuk Official', type: 'bank', icon: '🏦' },
  { id: '3', bankName: 'Dana', accountNumber: '08123456789', accountName: 'RekberYuk', type: 'ewallet', icon: '💳' },
  { id: '4', bankName: 'GoPay', accountNumber: '08198765432', accountName: 'RekberYuk', type: 'ewallet', icon: '💚' },
];

const ADMIN_QUICK_REPLIES = [
  'Halo kak, selamat datang di RekberYuk! 👋',
  'Dana sudah diterima ✅',
  'Silakan kirim bukti transfer ya',
  'Transaksi sudah selesai, terima kasih! 🙏',
  'Mohon tunggu ya kak, sedang diproses ⏳',
  'Seller, silakan kirim barangnya ya',
  'Buyer, mohon konfirmasi jika barang sudah diterima',
  'Dana akan diteruskan ke seller 💸',
];

const CLIENT_QUICK_REPLIES = [
  'Halo min, mau rekber dong 👋',
  'Sudah transfer ya min ✅',
  'Barang sudah diterima, kondisi oke! 👍',
  'Kapan dana bisa dicairkan?',
  'Terima kasih min 🙏',
  'Boleh cek dulu min?',
  'Mau tanya soal prosedurnya',
  'Oke min, siap!',
];

const DUMMY_MESSAGES: Record<string, Message[]> = {
  'grp-001': [
    { id: '1', sender: 'Admin', senderRole: 'admin', text: 'Halo kak, selamat datang di grup rekber untuk transaksi iPhone 15 Pro Max! 👋 Saya admin yang akan membantu transaksi kalian.', time: '09:00', isMe: false },
    { id: '2', sender: 'alex_buyer', senderRole: 'buyer', text: 'Halo min, saya mau beli iPhone 15 Pro Max dari bob_seller', time: '09:02', isMe: false },
    { id: '3', sender: 'bob_seller', senderRole: 'seller', text: 'Baik min, barangnya ready. iPhone 15 Pro Max 256GB Natural Titanium', time: '09:05', isMe: false },
    { id: '4', sender: 'Admin', senderRole: 'admin', text: 'Baik, detail transaksi:\n\n📦 iPhone 15 Pro Max 256GB\n💰 Harga: Rp 18.500.000\n🏦 Fee rekber: Rp 185.000\n\nSilakan buyer transfer total Rp 18.685.000 ke rekening rekber ya.', time: '09:10', isMe: false },
    { id: '5', sender: 'alex_buyer', senderRole: 'buyer', text: 'Sudah transfer min ✅', time: '09:45', isMe: false },
    { id: '6', sender: 'Admin', senderRole: 'admin', text: 'Dana sudah diterima ✅\n\nSeller @bob_seller, silakan kirim barangnya ya. Jangan lupa share resi pengirimannya di sini.', time: '10:00', isMe: false },
    { id: '7', sender: 'bob_seller', senderRole: 'seller', text: 'Baik min, sudah dikirim via JNE YES. Resi: JNE1234567890', time: '10:30', isMe: false },
    { id: '8', sender: 'Admin', senderRole: 'admin', text: 'Buyer @alex_buyer, barang sudah dikirim ya 📦\nResi: JNE1234567890\n\nMohon konfirmasi jika sudah diterima dan kondisi oke!', time: '10:32', isMe: false },
    { id: '9', sender: 'alex_buyer', senderRole: 'buyer', text: 'Barang sudah diterima, kondisi oke! 👍', time: '14:00', isMe: false },
  ],
  'grp-002': [
    { id: '1', sender: 'Admin', senderRole: 'admin', text: 'Halo! Grup rekber untuk transaksi MacBook Air M2 sudah dibuat 🎉', time: '08:00', isMe: false },
    { id: '2', sender: 'carol_buyer', senderRole: 'buyer', text: 'Halo min, saya mau beli MacBook Air M2 dari dave_seller', time: '08:05', isMe: false },
    { id: '3', sender: 'dave_seller', senderRole: 'seller', text: 'Ready min, MacBook Air M2 15" Midnight 256GB', time: '08:10', isMe: false },
    { id: '4', sender: 'Admin', senderRole: 'admin', text: 'Baik, silakan buyer transfer ke rekening rekber ya. Total Rp 15.150.000 (sudah termasuk fee)', time: '08:15', isMe: false },
    { id: '5', sender: 'carol_buyer', senderRole: 'buyer', text: 'Sudah transfer min ✅', time: '09:15', isMe: false },
  ],
  'grp-003': [
    { id: '1', sender: 'Admin', senderRole: 'admin', text: 'Grup rekber PS5 Digital Edition 🎮', time: '14:00', isMe: false },
    { id: '2', sender: 'eve_buyer', senderRole: 'buyer', text: 'Halo min, mau rekber dong 👋', time: '14:05', isMe: false },
  ],
  'grp-004': [
    { id: '1', sender: 'Admin', senderRole: 'admin', text: 'Transaksi Samsung S24 Ultra selesai! Dana sudah diteruskan ke seller 🙏', time: '16:00', isMe: false },
  ],
  'grp-005': [
    { id: '1', sender: 'Admin', senderRole: 'admin', text: 'Grup rekber Nintendo Switch OLED 🎮\nTransaksi selesai! Terima kasih sudah menggunakan RekberYuk 🙏', time: '12:00', isMe: false },
  ],
};

const getSenderColor = (role: string) => {
  switch (role) {
    case 'admin':
      return '#6366F1';
    case 'buyer':
      return '#10B981';
    case 'seller':
      return '#F59E0B';
    default:
      return '#64748B';
  }
};

const getSenderBg = (role: string) => {
  switch (role) {
    case 'admin':
      return '#EDE9FE';
    case 'buyer':
      return '#D1FAE5';
    case 'seller':
      return '#FEF3C7';
    default:
      return '#F1F5F9';
  }
};

export default function ChatDetailScreen() {
  const { user } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatId = id || 'grp-001';
  const chatName = name || 'Chat';

  const initialMessages = DUMMY_MESSAGES[chatId] || DUMMY_MESSAGES['grp-001'];

  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map((msg) => ({
      ...msg,
      isMe:
        user?.role === 'admin'
          ? msg.senderRole === 'admin'
          : msg.senderRole === 'buyer',
    }))
  );

  const quickReplies =
    user?.role === 'admin' ? ADMIN_QUICK_REPLIES : CLIENT_QUICK_REPLIES;

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id: String(Date.now()),
      sender: user?.displayName || 'Anda',
      senderRole: user?.role === 'admin' ? 'admin' : 'buyer',
      text: text.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setShowQuickReplies(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendBankInfo = (bank: typeof BANK_ACCOUNTS[0]) => {
    const text =
      `🏦 Info Rekening Rekber\n\n` +
      `Bank: ${bank.bankName}\n` +
      `No. Rek: ${bank.accountNumber}\n` +
      `Atas Nama: ${bank.accountName}\n\n` +
      `Silakan transfer ke rekening di atas ya kak 🙏`;
    sendMessage(text);
    setShowBankModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === 'admin' ? 'Admin Mode' : 'Grup Rekber'} • {messages.length} pesan
          </Text>
        </View>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>👥</Text>
        </View>
      </View>

      {/* Bank Accounts Modal */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏦 Rekening Rekber</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {user?.role === 'admin'
                ? 'Pilih rekening untuk dikirim ke chat'
                : 'Tap nomor rekening untuk menyalin'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANK_ACCOUNTS.map((bank) => (
                <View key={bank.id} style={styles.bankCard}>
                  <View style={styles.bankCardHeader}>
                    <Text style={styles.bankIcon}>{bank.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName}>{bank.bankName}</Text>
                      <Text style={styles.bankType}>
                        {bank.type === 'ewallet' ? 'E-Wallet' : 'Bank Transfer'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bankNumberRow}>
                    <View>
                      <Text style={styles.bankNumber}>{bank.accountNumber}</Text>
                      <Text style={styles.bankAccountName}>a.n. {bank.accountName}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.copyButton,
                        copiedId === bank.id && styles.copyButtonDone,
                      ]}
                      onPress={() => copyToClipboard(bank.accountNumber, bank.id)}
                    >
                      <Text style={styles.copyButtonText}>
                        {copiedId === bank.id ? '✅ Tersalin' : '📋 Salin'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {user?.role === 'admin' && (
                    <TouchableOpacity
                      style={styles.sendBankButton}
                      onPress={() => sendBankInfo(bank)}
                    >
                      <Text style={styles.sendBankButtonText}>
                        Kirim ke Chat ➤
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* System message */}
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>
              🔒 Transaksi diamankan oleh RekberYuk
            </Text>
          </View>

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.isMe ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              {!msg.isMe && (
                <View style={[styles.senderDot, { backgroundColor: getSenderColor(msg.senderRole) }]} />
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.isMe
                    ? styles.bubbleRight
                    : [styles.bubbleLeft, { backgroundColor: getSenderBg(msg.senderRole) }],
                ]}
              >
                {!msg.isMe && (
                  <Text style={[styles.senderName, { color: getSenderColor(msg.senderRole) }]}>
                    {msg.sender}
                  </Text>
                )}
                <Text style={[styles.messageText, msg.isMe && styles.messageTextRight]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, msg.isMe && styles.messageTimeRight]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Reply Section */}
        {showQuickReplies && (
          <View style={styles.quickReplyContainer}>
            <View style={styles.quickReplyHeader}>
              <Text style={styles.quickReplyTitle}>⚡ Balas Cepat</Text>
              <TouchableOpacity onPress={() => setShowQuickReplies(false)}>
                <Text style={styles.quickReplyClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal={false}
              showsVerticalScrollIndicator={false}
              style={styles.quickReplyScroll}
            >
              <View style={styles.quickReplyGrid}>
                {quickReplies.map((reply, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickReplyChip}
                    onPress={() => sendMessage(reply)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReplyChipText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.quickReplyToggle, showQuickReplies && styles.quickReplyToggleActive]}
            onPress={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Text style={styles.quickReplyToggleText}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bankToggle}
            onPress={() => setShowBankModal(true)}
          >
            <Text style={styles.bankToggleText}>🏦</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Ketik pesan..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '600',
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatarText: {
    fontSize: 20,
  },
  chatWrapper: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  senderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 6,
  },
  bubbleRight: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 21,
  },
  messageTextRight: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeRight: {
    color: 'rgba(255,255,255,0.7)',
  },
  quickReplyContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    maxHeight: 200,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  quickReplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  quickReplyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  quickReplyClose: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
    padding: 4,
  },
  quickReplyScroll: {
    maxHeight: 150,
  },
  quickReplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
  },
  quickReplyChip: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0FF',
  },
  quickReplyChipText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  quickReplyToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickReplyToggleActive: {
    backgroundColor: '#6366F1',
  },
  quickReplyToggleText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  bankToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bankToggleText: {
    fontSize: 20,
  },
  // === Modal Styles ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalClose: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '600',
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 18,
  },
  bankCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  bankIcon: {
    fontSize: 28,
  },
  bankName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  bankType: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  bankNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  bankAccountName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  copyButton: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyButtonDone: {
    backgroundColor: '#D1FAE5',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  sendBankButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  sendBankButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
