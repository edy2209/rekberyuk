import { useAuth } from '@/contexts/auth-context';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const { user, register, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (authLoading) return null;

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert('Oops', 'Nama lengkap harus diisi');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Oops', 'Username harus diisi');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Oops', 'Username minimal 3 karakter');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Oops', 'Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oops', 'Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    const result = await register(username.trim().toLowerCase(), password, displayName.trim());
    setLoading(false);

    if (result.success) {
      Alert.alert('Berhasil! 🎉', result.message, [
        { text: 'Login Sekarang', onPress: () => router.replace('/login') },
      ]);
    } else {
      Alert.alert('Registrasi Gagal', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoMark}>
              <View style={styles.logoInner}>
                <Text style={styles.logoLetter}>R</Text>
              </View>
            </View>
            <Text style={styles.brandName}>RekberYuk</Text>
            <Text style={styles.brandCaption}>Buat akun baru</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daftar Akun</Text>

            {/* Display Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
              <View
                style={[
                  styles.fieldBox,
                  focusedField === 'displayName' && styles.fieldBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#B0B8C4"
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => setFocusedField('displayName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View
                style={[
                  styles.fieldBox,
                  focusedField === 'username' && styles.fieldBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ketik username kamu"
                  placeholderTextColor="#B0B8C4"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <Text style={styles.fieldHint}>Min. 3 karakter, huruf kecil</Text>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.fieldBox,
                  focusedField === 'password' && styles.fieldBoxFocused,
                ]}
              >
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#B0B8C4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.eyeToggle}>
                    {showPassword ? 'Tutup' : 'Lihat'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>KONFIRMASI PASSWORD</Text>
              <View
                style={[
                  styles.fieldBox,
                  focusedField === 'confirmPassword' && styles.fieldBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ketik ulang password"
                  placeholderTextColor="#B0B8C4"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnLoading]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.registerBtnText}>Mendaftarkan...</Text>
              ) : (
                <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login CTA */}
          <View style={styles.loginRow}>
            <Text style={styles.loginRowText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginRowLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  bgCircle1: {
    position: 'absolute',
    top: -width * 0.35,
    right: -width * 0.25,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#4F46E5',
    opacity: 0.06,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -width * 0.2,
    left: -width * 0.3,
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: '#4F46E5',
    opacity: 0.04,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 28,
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logoInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1D26',
    letterSpacing: -0.5,
  },
  brandCaption: {
    fontSize: 14,
    color: '#7C8091',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: '#1A1D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E95A6',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ECEEF2',
    paddingHorizontal: 16,
    height: 52,
  },
  fieldBoxFocused: {
    borderColor: '#4F46E5',
    backgroundColor: '#FAFAFF',
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1D26',
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    color: '#A0A6B4',
    marginTop: 6,
    marginLeft: 4,
  },
  eyeToggle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
    paddingLeft: 12,
  },
  registerBtn: {
    backgroundColor: '#4F46E5',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  registerBtnLoading: {
    opacity: 0.75,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginRowText: {
    fontSize: 14,
    color: '#7C8091',
  },
  loginRowLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
