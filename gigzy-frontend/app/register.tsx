import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authAPI } from '../services/api';
import { showAlert } from '../services/alert';

export default function RegisterScreen() {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('SEEKER'); // SEEKER or PROVIDER
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // OTP Verification States
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [otp, setOtp] = useState('');
  const otpInputs = useRef<Array<TextInput | null>>([]);
  const [timerSeconds, setTimerSeconds] = useState(120);

  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  // Handle countdown timer for code resend
  useEffect(() => {
    let interval: any = null;
    if (step === 'verify' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerSeconds]);

  // Auto-submit verification code when 6 digits are typed
  useEffect(() => {
    if (otp.length === 6 && step === 'verify') {
      handleRegister();
    }
  }, [otp, step]);

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newOtpArray = [...otpArray];
    newOtpArray[index] = cleaned;
    setOtpArray(newOtpArray);
    
    const joinedOtp = newOtpArray.join('');
    setOtp(joinedOtp);

    // Auto focus logic
    if (cleaned.length === 1 && index < 5) {
      otpInputs.current[index + 1]?.focus();
    } else if (cleaned.length === 0 && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address first');
      return;
    }
    setOtpSending(true);
    try {
      await authAPI.sendOtp(email);
      setOtpSent(true);
      setTimerSeconds(120); // Reset countdown timer to 2:00
      showAlert('Success', 'OTP has been sent to your email');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      showAlert('Error', msg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleNextStep = async () => {
    if (!name || !email || !password) {
      showAlert('Error', 'Please fill all fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    setOtpSending(true);
    try {
      await authAPI.sendOtp(email);
      setOtpSent(true);
      setStep('verify');
      setTimerSeconds(120);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send verification code. Please try again.';
      showAlert('Error', msg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !otp || !password) {
      // Don't alert immediately on auto-check unless length is 6
      if (otp.length === 6) showAlert('Error', 'Please fill all details');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Verify OTP
      await authAPI.verifyOtp(email, otp);

      // Step 2: Register user
      const userData = { email, password, name, role };
      await authAPI.register(userData);
      showAlert('Success', 'Registration completed! Please log in.');
      router.replace('/login' as any);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration/verification failed. Please try again.';
      showAlert('Verification Error', msg);
      // Reset OTP array on error so user can re-try
      setOtpArray(['', '', '', '', '', '']);
      setOtp('');
      otpInputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendCode = async () => {
    await handleSendOtp();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Unified Top Header matching Deel details header */}
        <View style={styles.topHeader}>
          <Text style={styles.logoText}>jobspot.</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Text style={styles.headerRightText}>Help</Text>
            </TouchableOpacity>
            {step === 'verify' && (
              <>
                <View style={styles.headerDivider} />
                <TouchableOpacity onPress={() => { setStep('register'); setOtpSent(false); setOtpArray(['', '', '', '', '', '']); setOtp(''); }}>
                  <Text style={styles.headerRightText}>Logout</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            {step === 'register' ? (
              // Step 1: Register Form Content
              <View style={styles.cardContainer}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login' as any)}>
                  <Ionicons name="arrow-back" size={20} color="#111827" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.screenTitle}>Create your account</Text>
                <Text style={styles.subtitle}>
                  Get access to exclusive gig opportunities by filling details below.
                </Text>

                {/* Full name input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g. Brandone Louis"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                {/* Email input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="your@gmail.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.fieldInput, styles.passwordInput]}
                      placeholder="Enter password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Role selection block */}
                <View style={styles.roleGroup}>
                  <Text style={styles.fieldLabel}>I want to register as a</Text>
                  <View style={styles.roleRow}>
                    <TouchableOpacity
                      style={[styles.roleBlock, role === 'SEEKER' && styles.roleBlockActive]}
                      onPress={() => setRole('SEEKER')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.roleBlockText, role === 'SEEKER' && styles.roleBlockTextActive]}>
                        JOB SEEKER
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roleBlock, role === 'PROVIDER' && styles.roleBlockActive]}
                      onPress={() => setRole('PROVIDER')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.roleBlockText, role === 'PROVIDER' && styles.roleBlockTextActive]}>
                        PROVIDER
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Signup Button */}
                <TouchableOpacity
                  style={[styles.primaryBtn, otpSending && { opacity: 0.7 }]}
                  onPress={handleNextStep}
                  disabled={otpSending}
                  activeOpacity={0.85}
                >
                  {otpSending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                {/* Redirect Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.replace('/login' as any)}>
                    <Text style={styles.linkText}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Step 2: Verification Required Screen (Matches Screenshots 1, 2, 3)
              <View style={styles.cardContainer}>
                {/* Back button to Register Form */}
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('register')}>
                  <Ionicons name="arrow-back" size={20} color="#111827" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.screenTitle}>Verification required</Text>
                <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

                {/* Envelope Illustration with slide-out sheet */}
                <View style={styles.illustrationContainer}>
                  <View style={styles.envelopeCircle}>
                    {/* Popping Letter Sheet */}
                    <View style={styles.letterSheet}>
                      <Text style={styles.letterText}>123 456</Text>
                    </View>
                    {/* Envelope Body */}
                    <View style={styles.envelopeBody}>
                      <View style={styles.envelopeFlapLeft} />
                      <View style={styles.envelopeFlapRight} />
                    </View>
                  </View>
                </View>

                {/* Informational Callout Callbox */}
                <View style={styles.infoCallbox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#4B5563"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    We highly encourage setting up an authenticator app for the highest level of security. You
                    can set up an authenticator app anytime through account settings &gt; security.
                  </Text>
                </View>

                {/* 6 Digit Square Inputs */}
                <View style={styles.otpInputsContainer}>
                  {otpArray.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        otpInputs.current[idx] = ref;
                      }}
                      style={[styles.otpBox, digit.length > 0 && styles.otpBoxFilled]}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, idx)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </View>

                {/* Resend timer button */}
                <TouchableOpacity
                  style={[styles.resendBtn, timerSeconds > 0 && styles.resendBtnDisabled]}
                  onPress={handleResendCode}
                  disabled={timerSeconds > 0 || otpSending}
                  activeOpacity={0.8}
                >
                  {otpSending ? (
                    <ActivityIndicator color="#111827" size="small" />
                  ) : timerSeconds > 0 ? (
                    <Text style={styles.resendBtnTextDisabled}>Resend again in ({formatTimer()})</Text>
                  ) : (
                    <Text style={styles.resendBtnTextActive}>Send a new code</Text>
                  )}
                </TouchableOpacity>

                {/* Loading indicator during verification */}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#111827" size="small" style={{ marginRight: 8 }} />
                    <Text style={styles.loadingText}>Verifying code...</Text>
                  </View>
                )}

                {/* Contact support link */}
                <TouchableOpacity style={styles.supportBtn}>
                  <Text style={styles.supportText}>
                    Can't access your account? <Text style={styles.supportHighlight}>Contact support</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  headerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D1D5DB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  cardContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 32,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    color: '#111827',
    fontSize: 15,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
  },
  roleGroup: {
    marginBottom: 24,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBlockActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  roleBlockText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  roleBlockTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },

  // Verification Step Elements
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  envelopeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE', // light blue circle
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  letterSheet: {
    width: 58,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 24,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  letterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  envelopeBody: {
    width: 78,
    height: 48,
    backgroundColor: '#C7D2FE', // envelope purple base
    position: 'absolute',
    bottom: 16,
    borderRadius: 6,
    zIndex: 2,
    flexDirection: 'row',
  },
  envelopeFlapLeft: {
    flex: 1,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 24,
    backgroundColor: '#B5C2FA',
  },
  envelopeFlapRight: {
    flex: 1,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 24,
    backgroundColor: '#B5C2FA',
  },
  infoCallbox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 28,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 52,
    marginBottom: 20,
  },
  resendBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  resendBtnTextDisabled: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  resendBtnTextActive: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  supportBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#4B5563',
  },
  supportHighlight: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
