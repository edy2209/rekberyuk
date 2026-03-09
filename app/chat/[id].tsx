import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { groupApi, type Group, type GroupMember, type MessageItem } from '@/services/api';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const getMemberRole = (group: Group | null, senderId: string): string => {
  if (!group) return 'buyer';
  const member = group.members.find((m) => m.user._id === senderId);
  return member?.role || 'buyer';
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

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Status flow: pending → paid → shipped → received → done (or cancelled at any step)
const STATUS_FLOW: Record<string, string> = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'received',
  received: 'done',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  paid: '💰 Sudah Bayar',
  shipped: '📦 Dikirim',
  received: '✅ Diterima',
  done: '🎉 Selesai',
  cancelled: '❌ Dibatalkan',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  shipped: '#8B5CF6',
  received: '#10B981',
  done: '#059669',
  cancelled: '#EF4444',
};

const isChatLocked = (status: string) => status === 'done' || status === 'cancelled';

export default function ChatDetailScreen() {
  const { user } = useAuth();
  const socket = useSocket();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<'buyer' | 'seller'>('buyer');

  const chatId = id || '';
  const chatName = name || 'Chat';
  const isAdmin = user?.role === 'admin';
  const chatLocked = group ? isChatLocked(group.status) : false;

  const quickReplies =
    user?.role === 'admin' ? ADMIN_QUICK_REPLIES : CLIENT_QUICK_REPLIES;

  // Fetch group detail + messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupData, msgData] = await Promise.all([
          groupApi.detail(chatId),
          groupApi.getMessages(chatId),
        ]);
        setGroup(groupData);
        setMessages(msgData.messages);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Gagal memuat chat');
      } finally {
        setLoading(false);
      }
    };
    if (chatId) fetchData();
  }, [chatId]);

  // Realtime: join room + listen new messages via socket
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit('join_group', chatId);

    const handleNewMessage = (msg: MessageItem) => {
      if (msg.group === chatId) {
        setMessages((prev) => {
          // Cegah duplikat
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    const handleStatusUpdate = (data: { groupId: string; status: string }) => {
      if (data.groupId === chatId) {
        setGroup((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave_group', chatId);
      socket.off('new_message', handleNewMessage);
      socket.off('status_update', handleStatusUpdate);
    };
  }, [socket, chatId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const newMsg = await groupApi.sendMessage(chatId, text.trim());
      // Tambah pesan langsung, socket akan cegah duplikat via _id check
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setInputText('');
      setShowQuickReplies(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Pesan gagal dikirim');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async (text: string, bankId: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(bankId);
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

  // === Status management (admin only) ===
  const handleNextStatus = () => {
    if (!group || !isAdmin) return;
    const nextStatus = STATUS_FLOW[group.status];
    if (!nextStatus) return;
    Alert.alert(
      'Update Status',
      `Ubah status ke "${STATUS_LABELS[nextStatus]}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Update',
          onPress: async () => {
            try {
              const updated = await groupApi.updateStatus(chatId, nextStatus);
              setGroup(updated);
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal update status');
            }
          },
        },
      ]
    );
  };

  const handleCancelTransaction = () => {
    if (!group || !isAdmin) return;
    if (isChatLocked(group.status)) return;
    Alert.alert(
      'Batalkan Transaksi',
      'Yakin ingin membatalkan transaksi ini? Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await groupApi.updateStatus(chatId, 'cancelled');
              setGroup(updated);
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal membatalkan');
            }
          },
        },
      ]
    );
  };

  // === Member management ===
  const handleAddMember = async () => {
    if (!addMemberUserId.trim()) {
      Alert.alert('Error', 'User ID harus diisi');
      return;
    }
    try {
      const updated = await groupApi.addMember(chatId, addMemberUserId.trim(), addMemberRole);
      setGroup(updated);
      setAddMemberUserId('');
      Alert.alert('Berhasil', 'Member ditambahkan');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal tambah member');
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (!isAdmin) return;
    Alert.alert(
      'Keluarkan Member',
      `Keluarkan ${member.user.displayName || member.user.username} dari grup?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluarkan',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await groupApi.removeMember(chatId, member.user._id);
              setGroup(updated);
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal mengeluarkan member');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{chatName}</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity onPress={() => setShowMembersModal(true)}>
            <Text style={styles.headerAvatarText}>👥</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Bar */}
      {group && (
        <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[group.status] + '15' }]}>
          <View style={styles.statusBarLeft}>
            <Text style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[group.status] }]}>
              {STATUS_LABELS[group.status] || group.status}
            </Text>
            <Text style={styles.statusPrice}>
              Rp {group.itemPrice.toLocaleString('id-ID')}
            </Text>
          </View>
          {isAdmin && !isChatLocked(group.status) && (
            <View style={styles.statusActions}>
              {STATUS_FLOW[group.status] && (
                <TouchableOpacity style={styles.statusNextBtn} onPress={handleNextStatus}>
                  <Text style={styles.statusNextBtnText}>
                    → {STATUS_LABELS[STATUS_FLOW[group.status]]}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.statusCancelBtn} onPress={handleCancelTransaction}>
                <Text style={styles.statusCancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Member Grup</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {group?.members.map((member) => (
                <View key={member.user._id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberAvatar}>{member.user.avatar || '👤'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>
                        {member.user.displayName || member.user.username}
                        {member.user._id === user?.id ? ' (Kamu)' : ''}
                      </Text>
                      <Text style={styles.memberUsername}>@{member.user.username}</Text>
                    </View>
                    <View style={[styles.memberRoleBadge, { backgroundColor: getSenderColor(member.role) + '20' }]}>
                      <Text style={[styles.memberRoleText, { color: getSenderColor(member.role) }]}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                  {isAdmin && member.role !== 'admin' && (
                    <TouchableOpacity
                      style={styles.removeMemberBtn}
                      onPress={() => handleRemoveMember(member)}
                    >
                      <Text style={styles.removeMemberBtnText}>Keluarkan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Member Section */}
              <View style={styles.addMemberSection}>
                <Text style={styles.addMemberTitle}>Tambah Member</Text>
                <View style={styles.addMemberRow}>
                  <TextInput
                    style={styles.addMemberInput}
                    placeholder="User ID"
                    placeholderTextColor="#94A3B8"
                    value={addMemberUserId}
                    onChangeText={setAddMemberUserId}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.addMemberRoleBtn, addMemberRole === 'buyer' && styles.addMemberRoleBtnActive]}
                    onPress={() => setAddMemberRole('buyer')}
                  >
                    <Text style={addMemberRole === 'buyer' ? styles.addMemberRoleTextActive : styles.addMemberRoleText}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addMemberRoleBtn, addMemberRole === 'seller' && styles.addMemberRoleBtnActive]}
                    onPress={() => setAddMemberRole('seller')}
                  >
                    <Text style={addMemberRole === 'seller' ? styles.addMemberRoleTextActive : styles.addMemberRoleText}>S</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addMemberSubmitBtn} onPress={handleAddMember}>
                    <Text style={styles.addMemberSubmitText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

          {messages.map((msg) => {
            const isMe = msg.sender._id === user?.id;
            const senderRole = getMemberRole(group, msg.sender._id);
            return (
              <View
                key={msg._id}
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowRight : styles.messageRowLeft,
                ]}
              >
                {!isMe && (
                  <View style={[styles.senderDot, { backgroundColor: getSenderColor(senderRole) }]} />
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isMe
                      ? styles.bubbleRight
                      : [styles.bubbleLeft, { backgroundColor: getSenderBg(senderRole) }],
                  ]}
                >
                  {!isMe && (
                    <Text style={[styles.senderName, { color: getSenderColor(senderRole) }]}>
                      {msg.sender.displayName || msg.sender.username}
                    </Text>
                  )}
                  <Text style={[styles.messageText, isMe && styles.messageTextRight]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.messageTime, isMe && styles.messageTimeRight]}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })}
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
        {chatLocked && !isAdmin ? (
          <View style={styles.lockedBar}>
            <Text style={styles.lockedBarText}>
              🔒 Transaksi {group?.status === 'done' ? 'sudah selesai' : 'dibatalkan'}. Chat ditutup.
            </Text>
          </View>
        ) : chatLocked && isAdmin ? (
          <View style={styles.lockedBar}>
            <Text style={styles.lockedBarText}>
              🔒 Transaksi {group?.status === 'done' ? 'selesai' : 'dibatalkan'}. Hanya admin yang bisa mengirim pesan.
            </Text>
          </View>
        ) : null}
        {(!chatLocked || isAdmin) && (
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
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? '…' : '➤'}</Text>
          </TouchableOpacity>
        </View>
        )}
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
  // === Status Bar ===
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statusPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusNextBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusNextBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCancelBtn: {
    backgroundColor: '#FEE2E2',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCancelBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  // === Locked Bar ===
  lockedBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  lockedBarText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  // === Members Modal ===
  memberCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    fontSize: 28,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  memberUsername: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  memberRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  removeMemberBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeMemberBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  addMemberSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addMemberTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addMemberInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  addMemberRoleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  addMemberRoleBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EDE9FE',
  },
  addMemberRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  addMemberRoleTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  addMemberSubmitBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemberSubmitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
