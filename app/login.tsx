import { useAuth } from '@/contexts/auth-context';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
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

export default function LoginScreen() {
  const { user, login, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (authLoading) return null;

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Oops', 'Lengkapi username dan password kamu');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Gagal', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Blue header with branding */}
      <View style={styles.blueHeader}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.brandRow}>
          <Image
            source={require('@/assets/images/splash-girl.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <View style={styles.brandInfo}>
            <View style={styles.logoSmall}>
              <Text style={styles.logoSmallText}>R</Text>
            </View>
            <Text style={styles.brandName}>RekberYuk</Text>
            <Text style={styles.brandCaption}>Transaksi Online Aman & Terpercaya</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akun</Text>
            <Text style={styles.cardSubtitle}>Selamat datang kembali! 👋</Text>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View
                style={[
                  styles.fieldBox,
                  focusedField === 'username' && styles.fieldBoxFocused,
                ]}
              >
                <Text style={styles.fieldIcon}>👤</Text>
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
                <Text style={styles.fieldIcon}>🔒</Text>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder="Masukkan password"
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
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Lupa password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Tunggu sebentar...</Text>
              ) : (
                <Text style={styles.loginBtnText}>Masuk 🚀</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register CTA */}
          <TouchableOpacity
            style={styles.registerBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerBtnText}>Buat Akun Baru</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Dengan masuk, kamu menyetujui{' '}
              <Text style={styles.footerLink}>Ketentuan Layanan</Text>
              {' & '}
              <Text style={styles.footerLink}>Kebijakan Privasi</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },

  // Blue header
  blueHeader: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2563EB',
    opacity: 0.3,
  },
  headerCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  headerImage: {
    width: 110,
    height: 130,
  },
  brandInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoSmallText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandCaption: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
    fontWeight: '500',
  },

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1D26',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E95A6',
    marginTop: 4,
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {
    marginBottom: 18,
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ECEEF2',
    paddingHorizontal: 14,
    height: 54,
  },
  fieldBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F4FF',
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1D26',
    fontWeight: '500',
  },
  eyeToggle: {
    fontSize: 18,
    paddingLeft: 12,
  },

  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },

  // Login button
  loginBtn: {
    backgroundColor: '#1E3A8A',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnLoading: {
    opacity: 0.75,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D5DAE6',
  },
  dividerText: {
    fontSize: 13,
    color: '#A0A6B4',
    fontWeight: '500',
    marginHorizontal: 14,
  },

  // Register
  registerBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // Footer
  footer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#A0A6B4',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
