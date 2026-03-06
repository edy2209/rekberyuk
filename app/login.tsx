import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { router, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Oops', 'Lengkapi username dan password kamu');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = login(username.trim(), password.trim());
      setLoading(false);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Gagal', result.message);
      }
    }, 600);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background shapes */}
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
            <Text style={styles.brandCaption}>Escrow service terpercaya</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akun</Text>

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
                    {showPassword ? 'Tutup' : 'Lihat'}
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
                <Text style={styles.loginBtnText}>Masuk</Text>
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
          <TouchableOpacity style={styles.registerBtn} activeOpacity={0.8}>
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

  // Brand
  brandSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 36,
  },
  logoMark: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logoInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D26',
    letterSpacing: -0.5,
  },
  brandCaption: {
    fontSize: 14,
    color: '#7C8091',
    marginTop: 6,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
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
  eyeToggle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
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
    color: '#4F46E5',
    fontWeight: '600',
  },

  // Login button
  loginBtn: {
    backgroundColor: '#4F46E5',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginVertical: 24,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E3EA',
  },
  dividerText: {
    fontSize: 13,
    color: '#A0A6B4',
    fontWeight: '500',
    marginHorizontal: 14,
  },

  // Register
  registerBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D5D8E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D26',
  },

  // Footer
  footer: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#A0A6B4',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
