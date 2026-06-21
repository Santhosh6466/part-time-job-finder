import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authAPI, removeToken, saveToken, decodeJWT } from '../services/api';
import { checkProfileComplete } from '../services/profileUtils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [showRegisterWarning, setShowRegisterWarning] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (loginError) setLoginError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (loginError) setLoginError(null);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter email and password');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setLoginError(null);
    try {
      // 🧹 Clear old token before login to prevent stale token issues
      await removeToken();

      const response = await authAPI.login(email, password);
      const body: any = response.data;
      console.log('🔑 Full login response body:', JSON.stringify(body));

      // Try every common backend response shape
      const token =
        body?.data?.token ||
        body?.token ||
        body?.data?.accessToken ||
        body?.accessToken ||
        (typeof body?.data === 'string' ? body.data : null) ||
        (typeof body === 'string' ? body : null);

      if (token) {
        // Save to storage
        await saveToken(token);

        // Decode JWT to get user role
        try {
          const decoded = decodeJWT(token) || {};
          const role = decoded.role || decoded.Role || '';
          console.log('👤 User role:', role);

          // Check if profile is complete
          const profileCheck = await checkProfileComplete(role);

          if (!profileCheck.complete) {
            console.log('⚠️ Profile incomplete, routing to onboarding');
            if (role === 'PROVIDER') {
              router.replace('/complete-provider-profile' as any);
            } else {
              router.replace('/complete-seeker-profile' as any);
            }
            return;
          }

          if (role === 'PROVIDER') {
            router.replace('/(provider)/my-jobs' as any);
          } else {
            router.replace('/(tabs)/home' as any);
          }
        } catch {
          // If decode fails, default to seeker home
          router.replace('/(tabs)/home' as any);
        }
      } else {
        setLoginError('Incorrect email or password');
      }
    } catch (error: any) {
      console.log('❌ Login error:', error);
      const msg = error.response?.data?.message || 'Incorrect email or password';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView
        style={styles.scrollStyle}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {/* Yellow header container */}
          <View style={styles.yellowHeader}>
            <Text style={styles.logoText}>jobspot.</Text>
            <View style={styles.sloganContainer}>
              <Text style={styles.sloganText}>Your forever</Text>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightText}>people platform</Text>
              </View>
            </View>
          </View>

          {/* White login card */}
          <View style={styles.whiteCard}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, loginError && styles.fieldLabelError]}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  activeInput === 'email' && styles.inputFocused,
                  loginError && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={handleEmailChange}
                  onFocus={() => setActiveInput('email')}
                  onBlur={() => setActiveInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {loginError && (
                  <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.errorIcon} />
                )}
              </View>
              {loginError && <Text style={styles.errorText}>{loginError}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  activeInput === 'password' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setActiveInput('password')}
                  onBlur={() => setActiveInput(null)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* LOGIN Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginBtnText}>Log in</Text>}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Need to create an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/register' as any)}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.socialIcon} />
              <Text style={styles.socialBtnText}>Log in using Google</Text>
            </TouchableOpacity>

            {/* SSO Login Button */}
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Ionicons name="key-outline" size={18} color="#111827" style={styles.socialIcon} />
              <Text style={styles.socialBtnText}>Log in using SSO</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Register Warning Modal */}
      <Modal visible={showRegisterWarning} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalCentered}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="information-circle-outline" size={44} color="#6366F1" />
              </View>
              <Text style={styles.modalTitle}>To create a Jobspot account please head to our website</Text>
              <Text style={styles.modalSubtitle}>
                If you are a worker or employer, please register via our web portal.
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowRegisterWarning(false)}>
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FEDF60', // Full screen background matches yellow header to avoid white flickers
  },
  scrollStyle: {
    backgroundColor: '#FEDF60',
  },
  scrollContent: {
    flexGrow: 1,
  },
  yellowHeader: {
    backgroundColor: '#FEDF60', // Bright warm yellow header matching Deel
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1.5,
    marginBottom: 32,
  },
  sloganContainer: {
    marginTop: 8,
  },
  sloganText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  highlightBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    borderRadius: 2,
  },
  highlightText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    minHeight: 500,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldLabelError: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 54,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  errorIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 24,
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#111827', // Dark black button
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpText: {
    color: '#4B5563',
    fontSize: 14,
  },
  signUpLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 54,
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialBtnText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCentered: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalCloseBtn: {
    backgroundColor: '#111827',
    borderRadius: 8,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
